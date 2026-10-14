import { Artist } from "../../musica";
import { loadAlbum } from "./albums";

const artistMetadata = new Map<string, Artist>();
export function loadArtist(artist: Artist) {
	artistMetadata.set(artist.id, artist);

	artist.albums.forEach((album) => loadAlbum(album));
}
export function deleteArtist(id: string) {
	artistMetadata.delete(id);
	artistColours.delete(id);
}

let idListPopulated = false;
const allArtistIds: string[] = [];

export async function getArtistIds() {
	if (!idListPopulated) {
		const idURL = `/api/artists/list`;
		const artistIdsRequest = await fetch(idURL);

		if (!artistIdsRequest.ok) {
			throw new Error(
				`Failed to list artists from ${idURL}: HTTP Status ${artistIdsRequest.status}`
			);
		}

		allArtistIds.push(...(await artistIdsRequest.json()));
		idListPopulated = true;
	}

	return allArtistIds;
}

export async function getArtistMetadata(id: string): Promise<Artist> {
	const cacheEntry = artistMetadata.get(id);
	if (cacheEntry) return cacheEntry;

	const artistFetch = await fetch(`/api/artist/${id}/info`, {
		priority: "high"
	});
	const artist: Artist = await artistFetch.json();

	artist.albums.sort((a, b) => (a.modified ?? 0) - (b.modified ?? 0));
	loadArtist(artist);

	return artist;
}

export async function getArtistMetadataBulk(ids: string[]): Promise<Artist[]> {
	if (ids.length == 0) return [];

	const idSet = new Set(ids);
	const knownIds = new Set(artistMetadata.keys());

	const unknownIds = idSet.difference(knownIds);

	if (unknownIds.size !== 0) {
		const artistStatsRequest = await fetch(`/api/bulk/artists/info`, {
			headers: { artists: JSON.stringify([...unknownIds]) },
			priority: "high"
		});

		const fetchedArtist: Artist[] = await artistStatsRequest.json();
		fetchedArtist.forEach((artist) => {
			artist.albums.forEach((album) => {
				album.tracks.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
			});

			loadArtist(artist);
		});
	}

	const results = ids.map((id) => artistMetadata.get(id));

	return results.filter((item) => item !== undefined);
}

const artistColours = new Map<string, string>();
export async function getArtistColour(id: string): Promise<string> {
	const cacheEntry = artistColours.get(id);
	if (cacheEntry) return cacheEntry;

	const colourFetch = await fetch(`/api/artist/${id}/colour`, {
		priority: "low"
	});
	const { dominantColour: colour }: { dominantColour: string } =
		await colourFetch.json();

	artistColours.set(id, colour);
	return colour;
}
