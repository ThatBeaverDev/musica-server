import { clamp } from "./math";

export function clampScore(score: number) {
	if (score > 50) {
		return 50;
	}

	if (score < -50) {
		return -50;
	}

	return score;
}

export function colourScore(score: number) {
	score = clampScore(score);

	if (score == 0) {
		return "rgb(255 255 255)";
	}

	const pow = 1.25;
	const val = clamp(255 - 5.1 * Math.pow(score, pow), 0, 255);

	if (score > 0) {
		// positive score, green stays at 255
		return `rgb(${val} 255 ${val})`;
	} else {
		// negative score, red stays at 255
		return `rgb(255 ${val} ${val}`;
	}
}
