import path from "node:path";
import { decodeBase64, encodeBase64 } from "./base64.js";

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

export function specifierToAlbumId(specifier: string) {
	return encodeURIComponent(encodeBase64(specifier));
}

export function albumIdToSpecifier(id: string) {
	return decodeBase64(decodeURIComponent(id));
}
