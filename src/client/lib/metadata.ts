import { Album, Artist, Track } from "../musica";

const trackMetadata = new Map<string, Track>();
export async function getTrackMetadata(id: string): Promise<Track> {
	const cacheEntry = trackMetadata.get(id);
	if (cacheEntry) return cacheEntry;

	const trackFetch = await fetch(`/api/track/${id}/info`, {
		priority: "high"
	});
	const track: Track = await trackFetch.json();

	trackMetadata.set(id, track);
	return track;
}

const trackColours = new Map<string, string>();
export async function getTrackColour(id: string): Promise<string> {
	const cacheEntry = trackColours.get(id);
	if (cacheEntry) return cacheEntry;

	const colourFetch = await fetch(`/api/track/${id}/colour`, {
		priority: "low"
	});
	const { dominantColour: colour }: { dominantColour: string } =
		await colourFetch.json();

	trackColours.set(id, colour);
	return colour;
}

export async function beforeTrackUpdate(track: Track) {
	trackMetadata.delete(track.id);
	trackColours.delete(track.id);

	albumMetadata.delete(track.albumId);
	albumColours.delete(track.albumId);

	artistMetadata.delete(track.albumArtistId);
	artistColours.delete(track.albumArtistId);

	idListPopulated = false;
	allAlbumIds.splice(0, Infinity);
}

const albumMetadata = new Map<string, Album>();

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
	album.tracks.forEach((track) => trackMetadata.set(track.id, track));

	albumMetadata.set(id, album);
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
		fetchedAlbums.forEach((album) => albumMetadata.set(album.id, album));
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

const artistMetadata = new Map<string, Artist>();

export async function getArtistMetadata(id: string): Promise<Artist> {
	const cacheEntry = artistMetadata.get(id);
	if (cacheEntry) return cacheEntry;

	const artistFetch = await fetch(`/api/artist/${id}/info`, {
		priority: "high"
	});
	const artist: Artist = await artistFetch.json();

	artist.albums.sort((a, b) => (a.modified ?? 0) - (b.modified ?? 0));
	artist.albums.forEach((album) => {
		album.tracks.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
		albumMetadata.set(album.id, album);

		album.tracks.forEach((track) => trackMetadata.set(track.id, track));
	});

	artistMetadata.set(id, artist);
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
