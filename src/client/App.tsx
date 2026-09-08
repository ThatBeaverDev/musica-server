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

declare global {
	interface Window {
		setBackground(background: string): void;
	}
}

export default function App() {
	const [size, setWindowSize] = useState({
		width: window.innerWidth,
		height: window.innerHeight
	});
	const [background, setBackground] = useState("transparent");
	window.setBackground = setBackground;

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
		<BrowserRouter>
			<Navbar />

			<div className={styles.content} style={{ background }}>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/album/:id" element={<Album />} />
					<Route path="/artist/:id" element={<Artist />} />
					<Route path="/search" element={<Search />} />
					<Route path="/edit/track/:id" element={<EditTrack />} />
				</Routes>
			</div>

			<Player mobile={mobile} />
		</BrowserRouter>
	);
}
