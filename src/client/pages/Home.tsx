import { useEffect, useState } from "react";
import { Album, Playlist } from "../musica";
import LargeAlbum from "../components/LargeAlbum";
import styles from "./home.module.css";
import LargePlaylist from "../components/LargePlaylist";
import SmartContextMenu, {
	smartContextMenuHelper
} from "../components/contextMenus/SmartContextMenu";
import { getAlbumIds, getAlbumMetadataBulk } from "../lib/metadata/albums";
import {
	getPlaylistIds,
	getPlaylistMetadataBulk
} from "../lib/metadata/playlists";

export default function Home() {
	const { contextMenu, activateContextMenu } = smartContextMenuHelper();

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

	document.title = "Home - Musica";

	return (
		<>
			<h1>Welcome</h1>

			<h3 className={styles.heading}>Recently Added</h3>
			<div className={styles.carousel}>
				{albums.map((album) => (
					<LargeAlbum
						key={album.id}
						album={album}
						onContextMenu={(e) =>
							activateContextMenu(e, { type: "album", album })
						}
					/>
				))}
			</div>

			<h3 className={styles.heading}>Playlists</h3>
			<div className={styles.carousel}>
				{playlists.map((playlist) => (
					<LargePlaylist
						key={playlist.id}
						playlist={playlist}
						onContextMenu={(e) =>
							activateContextMenu(e, {
								type: "playlist",
								playlist
							})
						}
					/>
				))}
			</div>

			{contextMenu && (
				<SmartContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					menu={contextMenu.data}
				/>
			)}
		</>
	);
}
