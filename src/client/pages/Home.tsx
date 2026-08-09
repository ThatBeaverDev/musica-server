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

			<div className="section"></div>
			<h3>Albums</h3>
			<div style={styles.grid} id="albumsGrid">
				{albums.map((album) => (
					<LargeAlbum
						key={album.id}
						album={album}
						onContextMenu={(e) => handleContextMenu(e, album)}
					/>
				))}
			</div>

			{/* Context menu if applicable */}
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

	//	const albumContainer = document.getElementById("albumsGrid");
	//	if (!albumContainer) return;
	//
	//	for (const album of albums) {
	//		const tileDiv = document.createElement("div");
	//		tileDiv.classList.add("card");
	//		tileDiv.addEventListener("contextmenu", (e) => {
	//			e.preventDefault();
	//
	//			const container = document.createElement("div");
	//			container.classList.add("album-context-menu");
	//			container.style.left = `${e.clientX}px`;
	//			container.style.top = `${e.clientY}px`;
	//
	//			document.body.appendChild(container);
	//
	//			const play = (shuffle: boolean) => {
	//				player.setQueue(
	//					[],
	//					album.tracks[0],
	//					album.tracks.slice(1),
	//					shuffle
	//				);
	//				player.resume();
	//			};
	//
	//			const items: [string, () => Promise<void> | void][] = [
	//				["Play", () => play(false)],
	//				["Shuffle", () => [play(true)]]
	//			];
	//
	//			const holder = document.createElement("p");
	//			holder.classList.add("album-context-menu-title");
	//			holder.innerText = `${album.artist} - ${album.title}`;
	//			container.appendChild(holder);
	//
	//			for (const item of items) {
	//				const holder = document.createElement("p");
	//				holder.classList.add("album-context-menu-item");
	//				holder.innerText = item[0];
	//
	//				holder.addEventListener("pointerdown", () => item[1]());
	//
	//				container.appendChild(holder);
	//			}
	//
	//			window.addEventListener("pointerdown", () => container.remove(), {
	//				once: true
	//			});
	//		});
	//
	//		const albumImage = document.createElement("img");
	//		albumImage.classList.add("albumArt");
	//		albumImage.src = `/api/track/${album.tracks?.[0].id}/art`;
	//		albumImage.loading = "lazy";
	//		albumImage.fetchPriority = "low";
	//		tileDiv.appendChild(albumImage);
	//
	//		const albumTitle = document.createElement("p");
	//		albumTitle.classList.add("album-title");
	//		albumTitle.innerText = album.title;
	//		tileDiv.appendChild(albumTitle);
	//
	//		const albumArtist = document.createElement("p");
	//		albumArtist.classList.add("album-artist");
	//		albumArtist.innerText = album.artist;
	//		tileDiv.appendChild(albumArtist);
	//
	//		tileDiv.addEventListener("click", () => {
	//			history.pushState({}, "", `/album/${album.id}`);
	//
	//			albumPage(div, aborteeFunction);
	//		});
	//
	//		albumContainer.appendChild(tileDiv);
	//	}
}

const styles = {
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
		gap: "15px"
	}
};
