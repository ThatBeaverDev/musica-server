import { useEffect, useState } from "react";
import { Album } from "../musica";
import LargeAlbum from "../components/LargeAlbum";
import AlbumContextMenu from "../components/contextMenus/AlbumContextMenu";
import { contextMenuHelper } from "../components/contextMenus/ContextMenu";
import { getAlbumIds, getAlbumMetadataBulk } from "../lib/metadata";
import styles from "./home.module.css";

export default function Home() {
	const { contextMenu, activateContextMenu } = contextMenuHelper<Album>();

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

	document.title = "Home - Musica";

	return (
		<>
			<h1>Welcome</h1>
			<h3 className={styles.heading}>Recently Added</h3>

			<div className={styles.grid}>
				{albums.map((album) => (
					<LargeAlbum
						key={album.id}
						album={album}
						onContextMenu={(e) => activateContextMenu(e, album)}
					/>
				))}
			</div>

			{contextMenu && (
				<AlbumContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					album={contextMenu.data}
				/>
			)}
		</>
	);
}
