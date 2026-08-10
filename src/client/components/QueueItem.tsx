import { useState } from "react";
import { Track } from "../musica";
import { player } from "../Player";
import { panelColour } from "../constants";

export default function QueueItem({
	track,
	offset
}: {
	track: Track;
	offset: number;
}) {
	const [hover, setIsHovered] = useState(false);

	return (
		<div
			style={styles.queueItem(hover)}

			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}

			onClick={() => player.skipForward(offset)}
		>
			<img style={styles.art} src={`/api/track/${track.id}/art`} />

			<div style={styles.trackInfo}>
				<p style={styles.title}>{track.title}</p>
				<p style={styles.artist}>{track.artist}</p>
			</div>
		</div>
	);
}

const trackProperty = {
	textAlign: "left" as "left",

	overflow: "hidden",
	whiteSpace: "nowrap",
	textOverflow: "ellipsis",

	pointerEvents: "none" as "none",
	userSelect: "none" as "none"
};

const styles = {
	queueItem(hover: boolean) {
		return {
			display: "flex",
			flexDirection: "row" as "row",
			marginBottom: "5px",

			width: "100%",

			borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
			transition: "ease 0.2s",

			backgroundColor: hover ? panelColour : ""
		};
	},

	art: {
		width: "50px",
		height: "50px",
		marginRight: "10px",
		borderRadius: "6%",

		pointerEvents: "none" as "none",
		userSelect: "none" as "none"
	},

	trackInfo: {
		justifyContent: "center",
		overflow: "hidden",

		pointerEvents: "none" as "none",
		userSelect: "none" as "none"
	},

	title: {
		...trackProperty,

		fontSize: "0.95rem",
		fontWeight: "500",
		color: "white"
	},

	artist: {
		...trackProperty,

		fontSize: "0.9rem",
		color: "#888"
	}
};
