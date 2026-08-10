import { useEffect, useState } from "react";
import { Album } from "../musica";
import { player } from "../Player";
//import albumPage from "./album";
import LargeAlbum from "../components/LargeAlbum";
import AlbumContextMenu from "../components/AlbumContextMenu";

export default function Home() {
	// context menu, close on any mouse press
	const [contextMenu, setContextMenu] = useState<{
		x: number;
		y: number;
		album: Album;
	} | null>(null);
	useEffect(() => {
		if (!contextMenu) return;

		const handleClose = () => setContextMenu(null);
		window.addEventListener("pointerdown", handleClose, { once: true });
	}, [contextMenu]);

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

	const handleContextMenu = (
		e: { clientX: number; clientY: number; preventDefault(): void },
		album: Album
	) => {
		e.preventDefault();
		setContextMenu({
			x: e.clientX,
			y: e.clientY,
			album
		});
	};

	const playAlbum = (album: Album, shuffle: boolean = false) => {
		if (!album.tracks?.length) return;

		player.setQueue([], album.tracks[0], album.tracks.slice(1), shuffle);
		player.resume();
	};

	return (
		<>
			<title>Home - Musica</title>

			<h1>Welcome</h1>
			<h3 style={styles.heading}>Albums</h3>

			<div style={styles.grid}>
				{albums.map((album) => (
					<LargeAlbum
						key={album.id}
						album={album}
						onContextMenu={(e) => handleContextMenu(e, album)}
					/>
				))}
			</div>

			{/* context menu if applicable */}
			{contextMenu && (
				<AlbumContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					album={contextMenu.album}
					onPlay={(shuffle) => playAlbum(contextMenu.album, shuffle)}
				/>
			)}
		</>
	);
}

const styles = {
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
		gap: "15px",
		overflow: "hidden"
	},

	heading: {
		padding: "20px 0px"
	}
};
