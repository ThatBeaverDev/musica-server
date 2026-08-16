import { getAlbumColour, getArtistColour, getTrackColour } from "./metadata";

export function hexToRgb(hex: string): [number, number, number] {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? [
				parseInt(result[1], 16),
				parseInt(result[2], 16),
				parseInt(result[3], 16)
			]
		: [0, 0, 0];
}

export async function getItemColours(
	type: "track" | "album" | "artist",
	id: string,
	maxValue: number = 70
): Promise<[string, string]> {
	const getItemColour = async () => {
		switch (type) {
			case "track":
				return getTrackColour(id);
			case "album":
				return getAlbumColour(id);
			case "artist":
				return getArtistColour(id);
		}
	};

	const colour = await getItemColour();
	const rgbMain = hexToRgb(colour);

	const largestMagnitude = Math.max(...rgbMain);
	const divisor = largestMagnitude / maxValue;

	const rgbDarker = rgbMain.map((value) => Math.round(value / divisor));
	const darker = `rgb(${rgbDarker.join(", ")})`;

	return [colour, darker];
}
