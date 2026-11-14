import { useEffect, useState } from "react";
import { Album, Playlist } from "../musica";
import LargeAlbum from "../components/LargeAlbum";
import styles from "./home.module.css";
import LargePlaylist from "../components/LargePlaylist";
import { getAlbumIds, getAlbumMetadataBulk } from "../lib/metadata/albums";
import {
	getPlaylistIds,
	getPlaylistMetadataBulk
} from "../lib/metadata/playlists";

export default function Home() {
	// fetch albums
	const [albums, setAlbums] = useState<Album[]>([]);
	useEffect(() => {
		let isMounted = true;

		const fetchAlbums = async () => {
			try {
				const albumIDs = await getAlbumIds();
				const albums = await getAlbumMetadataBulk(albumIDs);

				albums.sort((a, b) => b.modified - a.modified);

				if (isMounted) {
					setAlbums(albums);
				}
			} catch (error) {
				console.error("Error loading albums:", error);
			}
		};

		fetchAlbums();

		return () => {
			isMounted = false;
		};
	}, []);

	// fetch playlists
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	useEffect(() => {
		let isMounted = true;

		const fetchPlaylists = async () => {
			try {
				const playlistIDs = await getPlaylistIds();
				const playlists = await getPlaylistMetadataBulk(playlistIDs);

				//playlists.sort((a, b) => b.modified - a.modified);

				if (isMounted) {
					setPlaylists(playlists);
				}
			} catch (error) {
				console.error("Error loading playlists:", error);
			}
		};

		fetchPlaylists();

		return () => {
			isMounted = false;
		};
	}, []);

	type AlbumEntry = { type: "album"; entry: Album };
	type PlaylistEntry = { type: "playlist"; entry: Playlist };

	const [items, setItems] = useState<(AlbumEntry | PlaylistEntry)[]>([]);
	useEffect(() => {
		const itemlist: typeof items = [
			...albums.map((item): AlbumEntry => {
				return { type: "album", entry: item };
			}),
			...playlists.map((item): PlaylistEntry => {
				return { type: "playlist", entry: item };
			})
		];

		itemlist.sort((a, b) => b.entry.modified - a.entry.modified);

		setItems(itemlist);
	}, [albums, playlists]);

	document.title = "Home - Musica";

	return (
		<>
			<h1>Welcome</h1>

			<h3 className={styles.heading}>Your Library</h3>
			<div className={styles.grid}>
				{items.map((item) =>
					item.type == "album" ? (
						<LargeAlbum key={item.entry.id} album={item.entry} />
					) : (
						<LargePlaylist
							key={item.entry.id}
							playlist={item.entry}
						/>
					)
				)}
			</div>
		</>
	);
}
