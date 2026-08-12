import { MouseEventHandler, useState } from "react";
import { Artist } from "../musica";
import { useNavigate } from "react-router-dom";
import { cardColour } from "../constants";

export default function LargeArtist({
	artist,
	onContextMenu
}: {
	artist: Artist;
	onContextMenu: MouseEventHandler<HTMLDivElement>;
}) {
	const [isHovered, setIsHovered] = useState(false);
	const navigate = useNavigate();

	const showArtist = () => navigate(`/album/${artist.id}`);

	return (
		<div
			style={styles.card(isHovered)}
			onContextMenu={onContextMenu}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}

			onClick={showArtist}
		>
			<img
				loading="lazy"
				fetchPriority="low"
				src={artist?.thumbnail ?? `/api/artist/${artist.id}/art`}
				style={styles.artistPicture}
			/>

			<p style={styles.artistName}>{artist.name}</p>
			<p
				style={styles.albumCount}
			>{`${artist.albums.length} Album${artist.albums.length == 0 ? "" : "s"}`}</p>
		</div>
	);
}

const artistTitleBase = {
	textAlign: "center" as "center",
	overflow: "hidden",
	whiteSpace: "nowrap",
	textOverflow: "ellipsis"
};

const styles = {
	card(hovered: boolean) {
		return {
			background: hovered ? "rgb(45, 45, 45)" : cardColour,
			border: "1px solid rgba(255, 255, 255, 0.06)",

			borderRadius: "14px",
			padding: "14px",
			display: "flex",
			flexDirection: "column" as "column",
			transition: "0.2s ease",

			transform: hovered ? "scale(1.03)" : ""
		};
	},

	artistPicture: {
		width: "100%",
		aspectRatio: 1,
		objectFit: "cover" as "cover",
		borderRadius: "100%"
	},

	artistName: {
		...artistTitleBase,
		marginTop: "0.5rem",
		fontSize: "0.95rem",
		fontWeight: 600
	},
	albumCount: {
		...artistTitleBase,
		marginTop: "0.25rem",
		fontSize: "0.85rem",
		color: "#9a9a9a"
	}
};
