import { Playlist } from "../../musica";
import { loadTrack } from "./tracks";

const playlistMetadata = new Map<string, Playlist>();
export function loadPlaylist(playlist: Playlist) {
	playlistMetadata.set(playlist.id, playlist);

	playlist.tracks.forEach((track) => loadTrack(track));
}
export function deletePlaylist(id: string) {
	playlistMetadata.delete(id);
	playlistColours.delete(id);
	playlistIdListPopulated = false;
}
export function requirePlaylistIdRefresh() {
	playlistIdListPopulated = false;
	allPlaylistIds.splice(0, Infinity);
}

let playlistIdListPopulated = false;
const allPlaylistIds: string[] = [];

export async function getPlaylistIds() {
	if (!playlistIdListPopulated) {
		const idURL = `/api/playlists/list`;
		const playlistIdsRequest = await fetch(idURL);

		if (!playlistIdsRequest.ok) {
			throw new Error(
				`Failed to list playlists from ${idURL}: HTTP Status ${playlistIdsRequest.status}`
			);
		}

		allPlaylistIds.push(...(await playlistIdsRequest.json()));
		playlistIdListPopulated = true;
	}

	return allPlaylistIds;
}
export async function getPlaylistMetadata(id: string): Promise<Playlist> {
	const cacheEntry = playlistMetadata.get(id);
	if (cacheEntry) return cacheEntry;

	const playlistFetch = await fetch(`/api/playlist/${id}/info`, {
		priority: "high"
	});
	const playlist: Playlist = await playlistFetch.json();

	loadPlaylist(playlist);

	return playlist;
}

export async function getPlaylistMetadataBulk(
	ids: string[]
): Promise<Playlist[]> {
	if (ids.length == 0) return [];

	const idSet = new Set(ids);
	const knownIds = new Set(playlistMetadata.keys());

	const unknownIds = idSet.difference(knownIds);

	if (unknownIds.size !== 0) {
		const playlistStatsRequest = await fetch(`/api/bulk/playlists/info`, {
			headers: { playlists: JSON.stringify([...unknownIds]) },
			priority: "high"
		});

		const fetchedPlaylists: Playlist[] = await playlistStatsRequest.json();
		fetchedPlaylists.forEach((playlist) => {
			loadPlaylist(playlist);
		});
	}

	const results = ids.map((id) => playlistMetadata.get(id));

	return results.filter((item) => item !== undefined);
}

const playlistColours = new Map<string, string>();
export async function getPlaylistColour(id: string): Promise<string> {
	const cacheEntry = playlistColours.get(id);
	if (cacheEntry) return cacheEntry;

	const colourFetch = await fetch(`/api/playlist/${id}/colour`, {
		priority: "low"
	});
	const { dominantColour: colour }: { dominantColour: string } =
		await colourFetch.json();

	playlistColours.set(id, colour);
	return colour;
}
