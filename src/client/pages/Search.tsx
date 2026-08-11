import { useEffect, useState } from "react";
import { cardColour } from "../constants";
import { useRef } from "preact/hooks";
import { SearchResult } from "../musica";
import LargeAlbum from "../components/LargeAlbum";
import AlbumTrack from "../components/AlbumTrack";
import { player } from "../Player";
import LargeArtist from "../components/LargeArtist";

export default function Search() {
	const [query, setInputtedQuery] = useState(
		new URL(window.location.href).searchParams.get("query") ?? ""
	);

	const inputRef = useRef<HTMLInputElement | null>(null);
	const [searchActive, setSearchActive] = useState(false);

	function newTextboxState(val: string) {
		if (!val) return;

		setInputtedQuery(val);

		const url = new URL(window.location.href);

		url.searchParams.set("query", val);

		window.history.replaceState({}, "", url);
	}

	const [results, setResults] = useState<SearchResult | undefined>();

	useEffect(() => {
		let isMounted = true;

		const fetchResults = async () => {
			const searchResults: SearchResult = await (
				await fetch(`/api/search/${query}`)
			).json();

			if (isMounted) setResults(searchResults);
		};

		fetchResults();

		return () => {
			isMounted = false;
		};
	}, [query]);

	document.title = query
		? `Search results for ${query} - Musica`
		: "Search - Musica";

	return (
		<>
			<h1>Search</h1>

			<input
				style={styles.search(searchActive)}
				type="text"
				value={query}
				onChange={(e) => newTextboxState(e.target.value)}
				ref={inputRef}

				onFocus={() => setSearchActive(true)}
				onBlur={() => setSearchActive(false)}
			/>

			<h3 style={styles.resultsLabel}>{`Results for '${query}'`}</h3>

			{/* tracks */}
			{results?.tracks && results.tracks.length !== 0 ? (
				<h3 style={styles.panelLabel}>Tracks</h3>
			) : undefined}
			<div style={styles.resultPanelList}>
				{results
					? results.tracks.slice(0, 10).map((item, index) => (
							<AlbumTrack
								track={item}
								key={index}
								onClick={() => {
									player.setQueue(
										results.tracks.slice(0, index - 1),
										item,
										results.tracks.slice(index + 1)
									);
									player.resume();
								}}
								onContextMenu={() => {}}
								art={true}
							></AlbumTrack>
						))
					: undefined}
			</div>

			{/* albums */}
			{results?.albums && results.albums.length !== 0 ? (
				<h3 style={styles.panelLabel}>Albums</h3>
			) : undefined}
			<div style={styles.resultPanelGrid}>
				{results
					? results.albums
							.slice(0, 10)
							.map((item, index) => (
								<LargeAlbum
									album={item}
									key={index}
									onContextMenu={() => {}}
								></LargeAlbum>
							))
					: undefined}
			</div>

			{/* artists */}
			{results?.artists && results.artists.length !== 0 ? (
				<h3 style={styles.panelLabel}>Artists</h3>
			) : undefined}
			<div style={styles.resultPanelGrid}>
				{results
					? results.artists
							.slice(0, 10)
							.map((item, index) => (
								<LargeArtist
									artist={item}
									key={index}
									onContextMenu={() => {}}
								></LargeArtist>
							))
					: undefined}
			</div>
		</>
	);
}

const resultPanelBase = { width: "100%", marginBottom: "2rem" };

const styles = {
	search(active: boolean) {
		return {
			width: "100%",
			height: "45px",

			borderRadius: "12px",
			padding: "0 20px",
			marginTop: "2rem",
			marginBottom: "2rem",

			fontSize: "15px",
			color: "#e0e0e0",

			backgroundColor: cardColour,
			border: active ? "1px solid #aaa" : "1px solid #333",
			outline: "none",

			transition: "0.2s ease"
		};
	},

	resultsLabel: { marginBottom: "2rem" },
	panelLabel: { marginTop: "2rem", marginBottom: "1rem" },

	resultPanelList: {
		...resultPanelBase
	},
	resultPanelGrid: {
		...resultPanelBase,

		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 13rem))",
		gap: "1rem"
	}
};
