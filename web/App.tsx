import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Album from "./pages/Album";
import Artist from "./pages/Artist";
import Search from "./pages/Search";

import Navbar from "./components/Navbar/Navbar.js";
import Player from "./Player.js";
import { useState } from "react";
import styles from "./app.module.css";
import EditTrack from "./pages/edit/EditTrack";
import Playlist from "./pages/Playlist";
import SmartContextMenu, {
	smartContextMenuHelper
} from "./components/contextMenus/SmartContextMenu";

type ContextMenuActivator = ReturnType<
	typeof smartContextMenuHelper
>["activateContextMenu"];

declare global {
	interface Window {
		setBackground(background: string): void;
		setModal(modal: React.ReactNode | undefined): void;
		activateContextMenu: ContextMenuActivator;
	}

	const activateContextMenu: ContextMenuActivator;
}

export default function App() {
	const [size, setWindowSize] = useState({
		width: window.innerWidth,
		height: window.innerHeight
	});

	const [background, setBackground] = useState("transparent");
	window.setBackground = setBackground;
	const [modal, setModal] = useState<React.ReactNode | undefined>();
	window.setModal = setModal;
	const { contextMenu, activateContextMenu } = smartContextMenuHelper();
	window.activateContextMenu = activateContextMenu;

	window.addEventListener(
		"resize",
		() => {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight
			});
		},
		{
			once: true
		}
	);

	const aspectRatio = size.width / size.height;
	const mobile = aspectRatio < 0.7;

	const root = document.getElementById("root");

	if (root) {
		root.className = styles.main;
		if (mobile) {
			root.style.display = "flex";
			root.style.flexDirection = "column";
		} else {
			root.style.display = "";
			root.style.flexDirection = "";
		}
	}

	return (
		<>
			<BrowserRouter>
				<Navbar />

				<div className={styles.content} style={{ background }}>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/album/:id" element={<Album />} />
						<Route path="/artist/:id" element={<Artist />} />
						<Route path="/playlist/:id" element={<Playlist />} />
						<Route path="/search" element={<Search />} />
						<Route path="/edit/track/:id" element={<EditTrack />} />
					</Routes>
				</div>

				<Player mobile={mobile} />

				{contextMenu && (
					<SmartContextMenu
						x={contextMenu.x}
						y={contextMenu.y}
						menu={contextMenu.data}
					/>
				)}
			</BrowserRouter>

			{modal ? (
				<div
					className={styles.modalBackground}
					onClick={() => setModal(undefined)}
				/>
			) : undefined}
			{modal}
		</>
	);
}
