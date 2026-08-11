import { useState } from "preact/compat";
import { colourScore } from "../lib/score";
import { Track } from "../musica";
import { ContextMenuRequiredEvent } from "./contextMenus/ContextMenu";

export default function AlbumTrack({
	track,
	onClick,
	onContextMenu,
	art: showArt = false
}: {
	track: Track;
	onClick: () => void;
	onContextMenu: (e: ContextMenuRequiredEvent) => void;
	art?: boolean;
}) {
	const [hover, setIsHovered] = useState(false);

	const durationMinutesComponent = Math.floor(track.duration / 60);
	const durationSecondsComponent = Math.floor(track.duration % 60);

	const minutesFormatted = `${durationMinutesComponent}`.padStart(2, "0");
	const secondsFormatted = `${durationSecondsComponent}`.padStart(2, "0");

	return (
		<div
			style={styles.track(hover)}

			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={() => onClick()}
			onContextMenu={(e) => onContextMenu(e)}
		>
			{showArt ? (
				<img
					style={styles.art}
					src={`/api/track/${track.id}/art`}
				></img>
			) : (
				<span style={styles.trackNumber}>
					{track.number ? track.number : ""}
				</span>
			)}

			<div style={styles.trackInfo}>
				<p style={styles.title}>{track.title}</p>
				<div style={styles.artistScoreDiv}>
					<p style={styles.artist}>{track.artist}</p>

					<p
						style={{
							...styles.score,
							color: colourScore(track.score)
						}}
					>
						{`${Math.round(track.score)}`}
					</p>
				</div>
			</div>

			<p
				style={styles.duration}
			>{`${minutesFormatted}:${secondsFormatted}`}</p>
		</div>
	);
}

const titleArtistBase = {
	margin: 0,
	textAlign: "left" as "left",
	pointerEvents: "none" as "none"
};

const styles = {
	track(hover: boolean) {
		return {
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",

			padding: "12px 16px",
			borderTop: "1px solid rgba(255, 255, 255, 0.05)",
			borderBottom: "1px solid rgba(255, 255, 255, 0.05)",

			backgroundColor: hover ? "rgba(255, 255, 255, 0.05)" : "",

			transition: "background 0.2s"
		};
	},

	trackNumber: {
		width: "32px",
		color: "#777",
		fontSize: "0.9rem"
	},

	art: {
		width: "3rem",
		height: "3rem",
		marginRight: "1rem",
		borderRadius: "6%"
	},

	trackInfo: {
		display: "flex",
		flexDirection: "column" as "column",
		gap: "2px",
		flex: 1
	},

	title: {
		...titleArtistBase,
		fontSize: "0.95rem",
		fontWeight: 500,
		color: "white"
	},
	artist: { ...titleArtistBase, fontSize: "0.9rem", color: "#888" },

	artistScoreDiv: {
		display: "flex",
		flexDirection: "row" as "row",
		gap: "10px"
	},

	score: {
		fontSize: "0.9rem"
	},

	duration: {
		color: "#888"
	}
};
