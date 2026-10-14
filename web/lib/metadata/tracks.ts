import { Track } from "../../musica";
import { deleteAlbum } from "./albums";
import { deleteArtist } from "./artists";

const trackMetadata = new Map<string, Track>();
export function loadTrack(track: Track) {
	trackMetadata.set(track.id, track);
}
export function deleteTrack(id: string) {
	trackMetadata.delete(id);
	trackColours.delete(id);
}

let idListPopulated = false;
const allTrackIds: string[] = [];

export async function getTrackIds() {
	if (!idListPopulated) {
		const idURL = `/api/tracks/list`;
		const trackIdsRequest = await fetch(idURL);

		if (!trackIdsRequest.ok) {
			throw new Error(
				`Failed to list tracks from ${idURL}: HTTP Status ${trackIdsRequest.status}`
			);
		}

		allTrackIds.push(...(await trackIdsRequest.json()));
		idListPopulated = true;
	}

	return allTrackIds;
}

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

export async function getTrackMetadataBulk(ids: string[]): Promise<Track[]> {
	if (ids.length == 0) return [];

	const idSet = new Set(ids);
	const knownIds = new Set(trackMetadata.keys());

	const unknownIds = idSet.difference(knownIds);

	if (unknownIds.size !== 0) {
		const trackStatsRequest = await fetch(`/api/bulk/tracks/info`, {
			headers: { tracks: JSON.stringify([...unknownIds]) },
			priority: "high"
		});

		const fetchedTracks: Track[] = await trackStatsRequest.json();
		fetchedTracks.forEach((track) => {
			loadTrack(track);
		});
	}

	const results = ids.map((id) => trackMetadata.get(id));

	return results.filter((item) => item !== undefined);
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
	deleteTrack(track.id);
	deleteAlbum(track.albumId);
	deleteArtist(track.albumArtistId);
}
