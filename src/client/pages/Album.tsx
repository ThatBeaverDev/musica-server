import { useEffect, useState } from "react";
import { colourScore } from "../lib/score.js";
import { Album, Track } from "../musica.js";
import AlbumTrack from "../components/AlbumTrack.js";
import { onTrackSearchAndPlay, player } from "../Player.js";
import { contextMenuHelper } from "../components/contextMenus/ContextMenu.js";
import TrackContextMenu from "../components/contextMenus/TrackContextMenu.js";
import { useNavigate } from "react-router-dom";
import { hexToRgb } from "../lib/colour.js";

export default function Album() {
	const { contextMenu, activateContextMenu } = contextMenuHelper<Track>();
	const navigate = useNavigate();

	const id = new URL(window.location.href).pathname.split("/")[2];

	function playByIndex(index: number) {
		if (!album) return;

		player.setQueue(
			album.tracks.slice(0, index - 1),
			album.tracks[index],
			album.tracks.slice(index + 1)
		);

		player.resume();
	}
	const playTrack = (track: Track) => {
		if (!album) return;

		const index = album.tracks.map((track) => track.id).indexOf(track.id);

		playByIndex(index);
	};

	const [album, setAlbum] = useState<Album | undefined>();
	const [colours, setColours] = useState<[string, string] | undefined>();
	useEffect(() => {
		let isMounted = true;

		const fetchAlbum = async () => {
			try {
				const album: Album = await (
					await fetch(`/api/album/${id}/info`, { priority: "high" })
				).json();

				album.tracks.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

				if (isMounted) {
					setAlbum(album);

					const response: { dominantColour: string } = await (
						await fetch(`/api/album/${album.id}/colour`, {
							priority: "high"
						})
					).json();

					const rgbMain = hexToRgb(response.dominantColour);

					const largestMagnitude = Math.max(...rgbMain);
					const divisor = largestMagnitude / 30;

					const rgbDarker = rgbMain.map((value) =>
						Math.round(value / divisor)
					);
					const darker = `rgb(${rgbDarker.join(", ")})`;

					if (isMounted) {
						setColours([response.dominantColour, darker]);
					}
				}
			} catch (error) {
				console.error("Error loading albums:", error);
			}
		};

		fetchAlbum();

		return () => {
			isMounted = false;
		};
	}, []);

	const [artistLinkHover, setArtistLinkHover] = useState(false);

	useEffect(() => {
		if (colours) {
			window.setBackground(
				`linear-gradient(to bottom, ${colours[0]}, ${colours[1]} 330px`
			);
		}

		return () => window.setBackground("transparent");
	});

	const trackCountInfo = album
		? `${album.tracks.length} track${album.tracks.length == 1 ? "" : "s"}`
		: "";

	let totalAlbumDurationMinutes = 0;
	album?.tracks.forEach(
		(track) => (totalAlbumDurationMinutes += track.duration / 60)
	);

	const hours = Math.floor(totalAlbumDurationMinutes / 60);
	const minutes = Math.floor(totalAlbumDurationMinutes % 60);

	const hoursFormatted = hours == 0 ? "" : `${hours} hours`;
	const minutesFormatted = minutes == 0 ? "" : `${minutes} minutes`;

	const hoursAnd = hoursFormatted ? `${hoursFormatted} and ` : "";

	const albumDurationInfo = album ? hoursAnd + minutesFormatted : "";

	document.title = album
		? `${album.title} by ${album.artist} - Musica`
		: "Album - Musica";

	return (
		<>
			<div style={styles.hero}>
				<img
					style={styles.art}
					src={album ? `/api/album/${album.id}/art` : undefined}
				/>

				<div>
					<p>Album</p>

					<h1 style={styles.title}>
						{album?.title ?? "Loading Album..."}
					</h1>

					<p>
						{album ? (
							<>
								<span
									onMouseEnter={() =>
										setArtistLinkHover(true)
									}
									onMouseLeave={() =>
										setArtistLinkHover(false)
									}

									onClick={() =>
										navigate(`/artist/${album.artistId}`)
									}

									style={{
										textDecoration: artistLinkHover
											? "underline"
											: "",
										cursor: "pointer"
									}}
								>
									{album.artist}
								</span>
								<span>
									{album.release
										? ` (${new Date(album.release).getFullYear()})`
										: ""}
								</span>
							</>
						) : undefined}
					</p>
					<p style={{ color: album ? colourScore(album.score) : "" }}>
						{album ? `Score: ${Math.round(album.score)}` : ""}
					</p>
				</div>
			</div>

			<div>
				<h3>Tracks</h3>
				<div style={styles.trackList}>
					{album
						? album.tracks.map((track, index) => (
								<AlbumTrack
									key={index}
									track={track}
									onClick={() => {
										onTrackSearchAndPlay(track.id);

										playByIndex(index);
									}}
									onContextMenu={(e) => {
										onTrackSearchAndPlay(track.id);

										activateContextMenu(e, track);
									}}
								/>
							))
						: undefined}
				</div>

				<br />
				<p
					style={styles.albumMetadata}
				>{`${trackCountInfo} - ${albumDurationInfo}`}</p>
			</div>

			{contextMenu && (
				<TrackContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					track={contextMenu.data}
					onPlay={() => playTrack(contextMenu.data)}
				/>
			)}
		</>
	);
}

const styles = {
	hero: {
		display: "flex",
		alignItems: "flex-end",
		gap: "32px",
		marginBottom: "40px"
	},

	art: {
		width: "240px",
		height: "240px",
		objectFit: "cover" as "cover",
		borderRadius: "6%",
		boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
		flexShrink: 0
	},

	title: {
		margin: 0,
		fontSize: "3rem",
		fontWeight: 700,
		textAlign: "left" as "left",
		whiteSpace: "normal" as "normal"
	},

	trackList: {
		display: "flex",
		flexDirection: "column" as "column"
	},

	albumMetadata: {
		fontSize: "0.9rem",
		color: "#888"
	}
};
