import { Track } from "../musica";

export function formatSeconds(totalSeconds: number) {
	if (isNaN(totalSeconds)) return "00:00";

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.floor(totalSeconds % 60);

	const hoursString = `${hours}`.padStart(2, "0");
	const minutesString = `${minutes}`.padStart(2, "0");
	const secondsString = `${seconds}`.padStart(2, "0");

	if (hours) return `${hoursString}:${minutesString}:${secondsString}`;
	else return `${minutesString}:${secondsString}`;
}

export function formatTrackListDuration(list: Track[]): string {
	let durationMinutes = 0;
	list.forEach((track) => (durationMinutes += track.duration / 60));

	const hours = Math.floor(durationMinutes / 60);
	const minutes = Math.floor(durationMinutes % 60);

	const hoursFormatted = hours == 0 ? "" : `${hours} hours`;
	const minutesFormatted = minutes == 0 ? "" : `${minutes} minutes`;

	const hoursAnd = hoursFormatted ? `${hoursFormatted} and ` : "";

	const duration = hoursAnd + minutesFormatted;

	return duration;
}
