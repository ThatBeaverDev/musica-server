import path from "node:path";
import * as fs from "node:fs/promises";
import { watch } from "node:fs";
import {
	getSupportedMimeTypes,
	IAudioMetadata,
	parseFile
} from "music-metadata";
import mime from "mime/lite";
import { getId } from "../id.js";

const supportedMimeTypes = getSupportedMimeTypes();

export interface Track {
	title: string;
	album: string;
	artist: string;

	// used to update files changed when inactive
	modified: number;
	release?: ReturnType<typeof Date.now>;

	path: string;
	id: string;
}

export interface Album {
	title: string;
	release: ReturnType<typeof Date.now>;
	tracks: Track[];
}

export interface TrackIndex {
	root: string;
	tracks: Partial<Record<string, Track>>;
	albums: Album[];
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
			albums: []
		};

		const removeTrack = (track: Track) => {
			this.#trackToPictureStoreMap.delete(track);
			this.#dirToTrackMap.delete(path.resolve(track.path));

			if (this.index?.tracks?.[track.id])
				delete this.index.tracks[track.id];
		};

		const queue: Promise<any>[] = [];
		await this.#walk(this.directory, startingIndex, queue);
		await Promise.all(queue);

		this.index = startingIndex;

		watch(this.directory, { recursive: true }, async (_, filename) => {
			if (!filename) return;

			const fullPath = path.join(this.directory, filename);

			try {
				const stats = await fs.stat(fullPath);

				const addTrack = async (path: string) => {
					const entry = await this.fileMetadata(path);

					if (entry) {
						this.#dirToTrackMap.set(path, entry);
						this.index!.tracks[entry.id] = entry;
					}
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
				const id = getId(relative);

				if (this.#dirToTrackMap.get(fullPath)) {
					// track
					const track = this.index?.tracks?.[id];
					if (track) removeTrack(track);
				} else {
					// directory
					const children = this.#dirToTrackMap
						.entries()
						.filter((item) => item[0].startsWith(fullPath + "/"));

					console.debug(this.#dirToTrackMap.entries(), fullPath);
					for (const [_, child] of children) {
						removeTrack(child);
					}
				}
			}
		});
	}

	async fileMetadata(directory: string): Promise<Track | undefined> {
		const relative = path.relative(process.cwd(), directory);
		const mimeType = mime.getType(directory) ?? "text/plain";
		if (!supportedMimeTypes.includes(mimeType)) return;

		const id = getId(directory);
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
		const album = metadata?.common?.album ?? "Singles";

		// modified time
		const { mtimeMs: modified } = await fs.stat(directory);

		// release
		const release = metadata?.common.releasedate
			? new Date(metadata?.common.releasedate).getTime()
			: undefined;

		const stats: Track = {
			title,
			artist,
			album,
			release,

			modified,
			path: relative,

			id
		};

		return stats;
	}

	async #walk(
		directory: string,
		index: TrackIndex,
		promiseQueue: Promise<any>[]
	) {
		const contents = await fs.readdir(directory, { withFileTypes: true });

		for (const child of contents) {
			const fullPath = path.join(directory, child.name);

			if (child.isDirectory()) {
				await this.#walk(fullPath, index, promiseQueue);
			} else {
				const mimeType = mime.getType(fullPath) ?? "text/plain";
				if (!supportedMimeTypes.includes(mimeType)) continue;

				const processFile = async () => {
					const entry = await this.fileMetadata(fullPath);

					if (entry) {
						this.#dirToTrackMap.set(fullPath, entry);
						index.tracks[entry.id] = entry;
					}
				};

				promiseQueue.push(processFile());
			}
		}
	}
}
