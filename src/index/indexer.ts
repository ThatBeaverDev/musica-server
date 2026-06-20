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

export interface Entry {
	title: string;
	album: string;
	artist: string;

	// used to update files changed when inactive
	modified: number;

	path: string;
	id: string;
}

export type Index = {
	root: string;
	items: Partial<Record<string, Entry>>;
};

export default class Indexer {
	index?: Index;
	constructor(public directory: string) {}

	#tracksMap = new Map<Entry, { mime: string }>();
	async getCover(entry: Entry) {
		const mapEntry = this.#tracksMap.get(entry);

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

			this.#tracksMap.set(entry, { mime: picture.format });

			return {
				mime: picture.format,
				directory: artPath
			};
		}
	}

	async init() {
		const startingIndex: Index = {
			root: this.directory,
			items: {}
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

				if (stats.isFile()) {
					const entry = await this.fileMetadata(fullPath);
					this.index!.items[entry.id] = entry;
					console.log(`Updated index: ${entry.title}`);
				}
			} catch {
				// file deleted
				const relative = path.relative(process.cwd(), filename);
				const id = Buffer.from(relative).toString("base64url");

				const entry = this.index!.items[id];
				if (entry) this.#tracksMap.delete(entry);

				delete this.index!.items[id];
				console.log(`Removed from index: ${relative}`);
			}
		});
	}

	async fileMetadata(directory: string): Promise<Entry> {
		const relative = path.relative(process.cwd(), directory);

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

		const stats: Entry = {
			title,
			artist,
			album,

			modified,
			path: relative,

			id
		};

		return stats;
	}

	async #walk(directory: string, index: Index, promiseQueue: Promise<any>[]) {
		const contents = await fs.readdir(directory, { withFileTypes: true });

		for (const child of contents) {
			const fullPath = path.join(directory, child.name);

			if (child.isDirectory()) {
				await this.#walk(fullPath, index, promiseQueue);
			} else {
				const mimeType = mime.getType(fullPath) ?? "text/plain";
				if (!supportedMimeTypes.includes(mimeType)) continue;

				const processFile = async () => {
					const indexStats = await this.fileMetadata(fullPath);
					index.items[indexStats.id] = indexStats;
				};

				promiseQueue.push(processFile());
			}
		}
	}
}
