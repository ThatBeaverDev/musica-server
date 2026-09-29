import { Album } from "../../musica";
import { loadTrack } from "./tracks";

const albumMetadata = new Map<string, Album>();
export function loadAlbum(album: Album) {
	albumMetadata.set(album.id, album);

	album.tracks.forEach((track) => loadTrack(track));
}
export function deleteAlbum(id: string) {
	albumMetadata.delete(id);
	albumColours.delete(id);

	idListPopulated = false;
	allAlbumIds.splice(0, Infinity);
}

let idListPopulated = false;
const allAlbumIds: string[] = [];

export async function getAlbumIds() {
	if (!idListPopulated) {
		const idURL = `/api/albums/list`;
		const albumIdsRequest = await fetch(idURL);

		if (!albumIdsRequest.ok) {
			throw new Error(
				`Failed to list albums from ${idURL}: HTTP Status ${albumIdsRequest.status}`
			);
		}

		allAlbumIds.push(...(await albumIdsRequest.json()));
		idListPopulated = true;
	}

	return allAlbumIds;
}
export async function getAlbumMetadata(id: string): Promise<Album> {
	const cacheEntry = albumMetadata.get(id);
	if (cacheEntry) return cacheEntry;

	const albumFetch = await fetch(`/api/album/${id}/info`, {
		priority: "high"
	});
	const album: Album = await albumFetch.json();

	album.tracks.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
	loadAlbum(album);

	return album;
}
export async function getAlbumMetadataBulk(ids: string[]): Promise<Album[]> {
	if (ids.length == 0) return [];

	const idSet = new Set(ids);
	const knownIds = new Set(albumMetadata.keys());

	const unknownIds = idSet.difference(knownIds);

	if (unknownIds.size !== 0) {
		const albumStatsRequest = await fetch(`/api/bulk/albums/info`, {
			headers: { albums: JSON.stringify([...unknownIds]) },
			priority: "high"
		});

		const fetchedAlbums: Album[] = await albumStatsRequest.json();
		fetchedAlbums.forEach((album) => {
			album.tracks.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

			loadAlbum(album);
		});
	}

	const results = ids.map((id) => albumMetadata.get(id));

	return results.filter((item) => item !== undefined);
}

const albumColours = new Map<string, string>();
export async function getAlbumColour(id: string): Promise<string> {
	const cacheEntry = albumColours.get(id);
	if (cacheEntry) return cacheEntry;

	const colourFetch = await fetch(`/api/album/${id}/colour`, {
		priority: "low"
	});
	const { dominantColour: colour }: { dominantColour: string } =
		await colourFetch.json();

	albumColours.set(id, colour);
	return colour;
}
