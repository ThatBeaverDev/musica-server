import { Album, Artist, Playlist, Track } from "../musica";

type MusicaItem = Track | Album | Artist | Playlist;

const durationMap = new Map<MusicaItem, number>();
export function duration(item: MusicaItem): number {
	const cacheValue = durationMap.get(item);
	if (cacheValue) return cacheValue;

	let duration = 0;
	if ("duration" in item) {
		// track

		duration = item.duration;
	} else if ("tracks" in item) {
		// album or playlist

		item.tracks.forEach((track) => {
			duration += track.duration;
		});
	} else if ("albums" in item) {
		// artist

		item.albums.forEach((album) => {
			album.tracks.forEach((track) => {
				duration += track.duration;
			});
		});
	} else {
		// something else
		console.warn(item, "does not have a discernable duration.");
		return 0;
	}

	durationMap.set(item, duration);
	return duration;
}

export function score(item: MusicaItem): number {
	if ("score" in item) {
		return item.score;
	} else if ("tracks" in item) {
		let totalScore = 0;

		item.tracks.forEach((track) => {
			totalScore += track.score;
		});

		const average = totalScore / item.tracks.length;

		return average;
	}

	return 0;
}
