import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import "./Player.js";
import Album from "./pages/Album";
//import Search from "./pages/Search";
import Navbar from "./Navbar.js";
import Player from "./Player.js";
import { useState } from "react";

export default function App() {
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	window.addEventListener("resize", () => setWindowWidth(window.innerWidth), {
		once: true
	});

	const styles = {
		content: {
			padding: "32px",
			overflowY: "auto" as "auto",
			width: `${windowWidth - 260}px`
		}
	};

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

			<Player />
		</BrowserRouter>
	);
}
