import { useEffect, useState } from "react";
import { colourScore } from "../lib/score.js";
import { Album, Track } from "../musica.js";
import AlbumTrack from "../components/AlbumTrack.js";
import { onTrackSearchAndPlay, player } from "../Player.js";
import { contextMenuHelper } from "../components/contextMenus/ContextMenu.js";
import TrackContextMenu from "../components/contextMenus/TrackContextMenu.js";
import { useNavigate } from "react-router-dom";
import { getItemColours } from "../lib/colour.js";
import BigPlayButton from "../components/BigPlayButton.js";
import { getAlbumMetadata } from "../lib/metadata.js";

export default function Album({ mobile }: { mobile: boolean }) {
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
				const album = await getAlbumMetadata(id);

				if (isMounted) {
					setAlbum(album);

					const [colour, darker] = await getItemColours("album", id);

					if (isMounted) {
						setColours([colour, darker]);
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
			<div style={styles.hero(mobile)}>
				<img
					style={styles.art}
					src={album ? `/api/album/${album.id}/art` : undefined}
				/>

				<div>
					<p style={styles.text(mobile)}>Album</p>

					<h1 style={styles.title(mobile)}>
						{album?.title ?? "Loading Album..."}
					</h1>

					<p style={styles.text(mobile)}>
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
					<p
						style={{
							...styles.text(mobile),
							color: album ? colourScore(album.score) : ""
						}}
					>
						{album ? `Score: ${Math.round(album.score)}` : ""}
					</p>

					<BigPlayButton
						style={styles.bigPlayButton(mobile)}

						onClick={() => {
							if (!album) return;
							player.setQueue(
								[],
								album.tracks[0],
								album.tracks.slice(1)
							);
							player.resume();
						}}
					></BigPlayButton>
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
	hero(mobile: boolean) {
		return {
			display: "flex",
			flexDirection: mobile ? ("column" as "column") : ("row" as "row"),
			alignItems: mobile ? "center" : "flex-end",
			gap: "32px",
			marginBottom: "40px"
		};
	},

	art: {
		width: "240px",
		height: "240px",
		objectFit: "cover" as "cover",
		borderRadius: "6%",
		boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
		flexShrink: 0
	},

	title(mobile: boolean) {
		return {
			margin: 0,
			fontSize: mobile ? "2rem" : "3rem",
			fontWeight: 700,
			textAlign: mobile ? ("center" as "center") : ("left" as "left"),
			whiteSpace: "normal" as "normal"
		};
	},

	text(mobile: boolean) {
		return {
			textAlign: mobile ? ("center" as "center") : ("left" as "left")
		};
	},

	bigPlayButton(mobile: boolean) {
		return mobile
			? {
					marginLeft: "auto",
					marginRight: "auto"
				}
			: {};
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
