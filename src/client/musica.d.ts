export interface Track {
	title: string;
	artist: string;

	album: string;
	albumArtist: string;

	modified: number;
	release?: ReturnType<typeof Date.now>;
	number?: number;

	path: string;
	id: string;
}

export interface Album {
	title: string;
	artist: string;
	id: string;

	modified: number;
	release?: ReturnType<typeof Date.now>;
	tracks: Track[];
}

export interface SearchResult {
	tracks: Track[];
	albums: Album[];
}
