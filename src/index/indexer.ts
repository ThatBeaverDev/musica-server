import path from "node:path";
import * as fs from "node:fs/promises";
import { watch } from "node:fs";
import {
	getSupportedMimeTypes,
	IAudioMetadata,
	parseFile
} from "music-metadata";
import mime from "mime/lite";
import { trackId } from "../id.js";

const supportedMimeTypes = getSupportedMimeTypes();

export interface Track {
	title: string;
	artist: string;

	album: string;
	albumArtist: string;

	// used to update files changed when inactive
	modified: number;
	release?: ReturnType<typeof Date.now>;
	number?: number;

	path: string;
	id: string;
}

export interface Album {
	title: string;
	artist: string;
	id: string; // URLEncoded(btoa(albumSpecifier))

	release?: ReturnType<typeof Date.now>;
	tracks: Track[];
}

export interface TrackIndex {
	root: string;
	tracks: Partial<Record<string, Track>>;
	albums: Partial<Record<string, Album>>;
}

export function getAlbumSpecifier(entry: Track) {
	return `${entry.albumArtist}:${entry.album}`;
}

export default class Indexer {
	index?: TrackIndex;
	constructor(public directory: string) {}

	#dirToTrackMap = new Map<string, Track>();
	#trackToPictureStoreMap = new Map<Track, { mime: string }>();
	async getCover(entry: Track) {
		const mapEntry = this.#trackToPictureStoreMap.get(entry);

		const artPath = path.resolve(
			process.cwd(),
			`./mediaCache/${entry.id}_art`
		);

		if (mapEntry) {
			return {
				mime: mapEntry.mime,
				directory: artPath
			};
		} else {
			const metadata = await parseFile(entry.path);

			const picture = metadata.common.picture?.[0];
			if (!picture) return null;

			await fs.writeFile(artPath, picture.data);

			this.#trackToPictureStoreMap.set(entry, { mime: picture.format });

			return {
				mime: picture.format,
				directory: artPath
			};
		}
	}

	async init() {
		const startingIndex: TrackIndex = {
			root: this.directory,
			tracks: {},
			albums: {}
		};

		await this.#walk(this.directory, startingIndex);

		this.index = startingIndex;

		watch(this.directory, { recursive: true }, async (_, filename) => {
			if (!filename) return;

			const fullPath = path.join(this.directory, filename);

			try {
				const stats = await fs.stat(fullPath);

				const addTrack = async (path: string) => {
					await this.indexTrack(path, this.index!);
				};

				const addRecursive = async (dir: string) => {
					const contents = await fs.readdir(dir, {
						withFileTypes: true
					});

					for (const child of contents) {
						const fullPath = path.join(dir, child.name);

						if (child.isDirectory()) {
							await addRecursive(fullPath);
						} else {
							await addTrack(fullPath);
						}
					}
				};

				if (stats.isFile()) {
					await addTrack(fullPath);
				} else {
					await addRecursive(fullPath);
				}
			} catch {
				// file deleted
				const relative = path.relative(process.cwd(), fullPath);
				const id = trackId(relative);

				if (this.#dirToTrackMap.get(fullPath)) {
					// track
					const track = this.index?.tracks?.[id];
					if (track) this.removeTrack(track, this.index!);
				} else {
					// directory
					const children = this.#dirToTrackMap
						.entries()
						.filter((item) => item[0].startsWith(fullPath + "/"));

					for (const [_, child] of children) {
						this.removeTrack(child, this.index!);
					}
				}
			}
		});
	}

	async fileMetadata(directory: string): Promise<Track | undefined> {
		const relative = path.relative(process.cwd(), directory);
		const mimeType = mime.getType(directory) ?? "text/plain";
		if (!supportedMimeTypes.includes(mimeType)) return;

		const id = trackId(directory);
		console.debug(`Indexing file at ${directory} (id: ${id})`);

		let metadata: IAudioMetadata | undefined = undefined;
		try {
			metadata = await parseFile(directory);
		} catch (err) {
			try {
				metadata = await parseFile(directory, { skipCovers: true });
				console.error(`File has broken art: ${directory}:`);
			} catch {
				console.error(
					`Failed to parse metadata for ${directory}:`,
					err
				);
			}
		}

		// title
		const trackTitle = metadata?.common?.title;
		const fileName = path.basename(directory, path.extname(directory));

		const title = trackTitle ?? fileName;

		// artist
		const artist = metadata?.common?.artist ?? "Various Artists";

		// album
		const album = metadata?.common?.album ?? title;
		const albumArtist =
			metadata?.common.albumartist ??
			metadata?.common.artist ??
			"Various Artists";

		// modified time
		const { mtimeMs: modified } = await fs.stat(directory);

		// release
		const releaseStore =
			metadata?.common.date ?? metadata?.common.releasedate;
		const release = releaseStore
			? new Date(releaseStore).getTime()
			: undefined;

		// number
		const number = metadata?.common.track.no ?? undefined;

		const stats: Track = {
			title,
			artist,

			album,
			albumArtist,

			release,
			modified,
			path: relative,

			id,
			number
		};

		return stats;
	}

	async indexTrack(directory: string, index: TrackIndex) {
		const entry = await this.fileMetadata(directory);

		if (entry) {
			this.#dirToTrackMap.set(directory, entry);
			index.tracks[entry.id] = entry;

			const albumSpecifier = getAlbumSpecifier(entry);

			const album = index.albums[albumSpecifier];
			if (album) {
				if (!album.release && entry.release)
					album.release = entry.release;

				album.tracks.push(entry);
			} else {
				index.albums[albumSpecifier] = {
					title: entry.album,
					artist: entry.albumArtist,
					release: entry.release,
					tracks: [entry],
					id: albumSpecifier
				};
			}
		}
	}

	async removeTrack(track: Track, index: TrackIndex) {
		this.#trackToPictureStoreMap.delete(track);
		this.#dirToTrackMap.delete(path.resolve(track.path));

		delete index.tracks[track.id];

		for (const albumId in index.albums) {
			const album = index.albums[albumId];
			if (!album) continue;

			if (album.tracks.includes(track)) {
				album.tracks = album.tracks.filter(
					(item) => item.id !== track.id
				);
			}
		}
	}

	async #walk(directory: string, index: TrackIndex) {
		const contents = await fs.readdir(directory, { withFileTypes: true });
		contents.sort();

		for (const child of contents) {
			const fullPath = path.join(directory, child.name);

			if (child.isDirectory()) {
				await this.#walk(fullPath, index);
			} else {
				const mimeType = mime.getType(fullPath) ?? "text/plain";
				if (!supportedMimeTypes.includes(mimeType)) continue;

			}
		}
	}
}
