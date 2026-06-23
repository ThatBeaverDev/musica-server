export interface Track {
	title: string;
	artist: string;

	album: string;
	albumArtist: string;

	// used to update files changed when inactive
	modified: number;
	release?: ReturnType<typeof Date.now>;
	number?: number;

	path: string;
	id: string;
}

export interface Album {
	title: string;
	artist: string;
	id: string; // URLEncoded(btoa(albumSpecifier))

	release?: ReturnType<typeof Date.now>;
	tracks: Track[];
}
