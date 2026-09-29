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
