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
	deleteTrack(track.id);
	deleteAlbum(track.albumId);
	deleteArtist(track.albumArtistId);
}
