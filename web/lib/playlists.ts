import { Track } from "../musica";
import {
	getPlaylistMetadata,
	requirePlaylistIdRefresh
} from "./metadata/playlists";

export async function createPlaylist(
	name: string,
	description: string,
	tracks: Track[]
) {
	console.debug(
		"Creating playlist called '" +
			name +
			"', with " +
			tracks.length +
			" items"
	);

	if (tracks.length < 1) {
		throw new Error("Playlist cannot be empty.");
	}

	await fetch(`/api/playlists/new`, {
		headers: {
			"playlist-title": name,
			"playlist-description": description,
			"playlist-tracks": JSON.stringify(tracks.map((track) => track.id))
		},
		priority: "high"
	});

	requirePlaylistIdRefresh();
}

export async function addItemsToPlaylist(playlistId: string, tracks: Track[]) {
	const playlist = await getPlaylistMetadata(playlistId);

	const newTrackList = [...playlist.tracks, ...tracks];

	await fetch(`/api/playlist/${playlistId}/setItems`, {
		headers: {
			tracks: JSON.stringify(newTrackList.map((item) => item.id))
		},
		priority: "high"
	});
	playlist.tracks = newTrackList;
}
