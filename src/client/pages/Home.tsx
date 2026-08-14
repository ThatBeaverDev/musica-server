import { useEffect, useState } from "react";
import { Album } from "../musica";
import { player } from "../Player";
//import albumPage from "./album";
import LargeAlbum from "../components/LargeAlbum";
import AlbumContextMenu from "../components/contextMenus/AlbumContextMenu";
import { contextMenuHelper } from "../components/contextMenus/ContextMenu";

export default function Home() {
	const { contextMenu, activateContextMenu } = contextMenuHelper<Album>();

	// fetch albums
	const [albums, setAlbums] = useState<Album[]>([]);
	useEffect(() => {
		let isMounted = true;

		const fetchAlbums = async () => {
			try {
				const idURL = `/api/albums/list`;
				const albumIdsRequest = await fetch(idURL);

				if (!albumIdsRequest.ok) {
					throw new Error(
						`Failed to list albums from ${idURL}: HTTP Status ${albumIdsRequest.status}`
					);
				}
				const albumIDs = await albumIdsRequest.json();

				const albumStatsRequest = await fetch(`/api/bulk/albums/info`, {
					headers: { albums: JSON.stringify(albumIDs) },
					priority: "high"
				});

				if (!albumStatsRequest.ok) {
					throw new Error(
						`Failed to fetch album info: HTTP Status ${albumStatsRequest.status}`
					);
				}
				const fetchedAlbums: Album[] = await albumStatsRequest.json();

				fetchedAlbums.sort((a, b) => b.modified - a.modified);

				if (isMounted) {
					setAlbums(fetchedAlbums);
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

	const playAlbum = (album: Album, shuffle: boolean = false) => {
		if (!album.tracks?.length) return;

		player.setQueue([], album.tracks[0], album.tracks.slice(1), shuffle);
		player.resume();
	};

	document.title = "Home - Musica";

	return (
		<>
			<h1>Welcome</h1>
			<h3 style={styles.heading}>Recently Added</h3>

			<div style={styles.grid}>
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
					onPlay={(shuffle) => playAlbum(contextMenu.data, shuffle)}
				/>
			)}
		</>
	);
}

const styles = {
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 13rem))",
		gap: "1rem"
	},

	heading: {
		padding: "20px 0px"
	}
};
