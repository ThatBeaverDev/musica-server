import path from "node:path";

const trackIds = new Map<string, number>();
let lastTrackId = 0;

export function trackId(dir: string) {
	const directory = path.join(process.cwd(), dir);

	if (trackIds.has(directory)) {
		return `${trackIds.get(directory)}`;
	} else {
		const id = lastTrackId++;
		trackIds.set(directory, id);
		return `${id}`;
	}
}

const albumSpecifierToIdMap = new Map<string, string>();
const albumIdToSpecifierMap = new Map<string, string>();

let nextId: number = 0;

export function specifierToAlbumId(specifier: string) {
	const id = albumSpecifierToIdMap.get(specifier);
	if (id) {
		return id;
	} else {
		const next = `${nextId++}`;
		albumSpecifierToIdMap.set(specifier, next);
		albumIdToSpecifierMap.set(next, specifier);

		return next;
	}
}

export function albumIdToSpecifier(id: string) {
	const spec = albumIdToSpecifierMap.get(id);

	if (spec) return spec;
	throw new Error("ID is not assigned.");
}
