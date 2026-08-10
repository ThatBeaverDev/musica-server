import { useState } from "preact/compat";
import { colourScore } from "../lib/score";
import { Track } from "../musica";

export default function AlbumTrack({
	track,
	number,
	onClick
}: {
	track: Track;
	number?: number;
	onClick: () => void;
}) {
	const [hover, setIsHovered] = useState(false);

	return (
		<div
			style={styles.track(hover)}

			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={() => onClick()}
		>
			<span style={styles.trackNumber}>{number ? number : ""}</span>

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
	}
};
