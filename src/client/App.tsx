import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Album from "./pages/Album";
//import Search from "./pages/Search";

import Navbar from "./Navbar.js";
import Player from "./Player.js";
import { useState } from "react";

export default function App() {
	const [size, setWindowSize] = useState({
		width: window.innerWidth,
		height: window.innerHeight
	});

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

	const styles = {
		content: {
			padding: "32px",
			overflowY: "auto" as "auto",

			width: mobile ? "100%" : `calc(100% - 260px)`,
			height: mobile ? "calc(100dvh - (40dvh + 50px))" : undefined,

			flexGrow: 1
		}
	};

	const root = document.getElementById("root");
	if (root)
		if (mobile) {
			root.style.display = "flex";
			root.style.flexDirection = "column";
		} else {
			root.style.display = "";
			root.style.flexDirection = "";
		}

	return (
		<BrowserRouter>
			<Navbar />

			<div style={styles.content}>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/album/:id" element={<Album />} />
					{/*<Route path="/artist/:id" element={<Artist />} />
					<Route path="/search" element={<Search />} />*/}
				</Routes>
			</div>

			<Player mobile={mobile} />
		</BrowserRouter>
	);
}
