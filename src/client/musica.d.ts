export interface Track {
	title: string;
	artist: string;

	album: string;
	albumArtist: string;

	modified: number;
	release?: ReturnType<typeof Date.now>;
	number?: number;

	id: string;

	score: number;

	subset: Subset;
}

export interface Album {
	title: string;
	artist: string;
	id: string;

	modified: number;
	release?: ReturnType<typeof Date.now>;
	tracks: Track[];

	score: number;
}

export interface SearchResult {
	tracks: Track[];
	albums: Album[];
}

export type Subset =
	"standard" | "exploration" | "wildcard" | "dislike" | "other";

export interface RandomMixTrackResult {
	id: string;
	subset: Subset;
}
