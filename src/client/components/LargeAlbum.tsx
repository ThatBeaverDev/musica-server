import { MouseEventHandler, useState } from "react";
import { Album } from "../musica";
import { useNavigate } from "react-router-dom";

export default function LargeAlbum({
	album,
	onContextMenu
}: {
	album: Album;
	onContextMenu: MouseEventHandler<HTMLDivElement>;
}) {
	const [isHovered, setIsHovered] = useState(false);
	const navigate = useNavigate();

	const showAlbum = () => navigate(`/album/${album.id}`);

	return (
		<div
			style={styles.card(isHovered)}
			onContextMenu={onContextMenu}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}

			onClick={showAlbum}
		>
			<img
				className="albumArt"
				loading="lazy"
				fetchPriority="low"
				src={`/api/track/${album.tracks?.[0].id}/art`}
			/>

			<p style={styles.albumTitle}>{album.title}</p>
			<p style={styles.albumArtist}>{album.artist}</p>
		</div>
	);

	//	const albumImage = document.createElement("img");
	//	albumImage.classList.add("albumArt");
	//	albumImage.src = `/api/track/${album.tracks?.[0].id}/art`;
	//	albumImage.loading = "lazy";
	//	albumImage.fetchPriority = "low";
	//	images.push(albumImage);
	//	tileDiv.appendChild(albumImage);
	//
	//	const albumTitle = document.createElement("p");
	//	albumTitle.classList.add("album-title");
	//	albumTitle.innerText = album.title;
	//	tileDiv.appendChild(albumTitle);
	//
	//	const albumArtist = document.createElement("p");
	//	albumArtist.classList.add("album-artist");
	//	albumArtist.innerText = album.artist;
	//	tileDiv.appendChild(albumArtist);
	//
	//	tileDiv.addEventListener("click", () => {
	//		history.pushState({}, "", `/album/${album.id}`);
	//
	//		albumPage(div, aborteeFunction);
	//	});
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
			background: hovered ? "rgb(45 45 45)" : "var(--card)",
			border: "1px solid rgba(255, 255, 255, 0.06)",

			borderRadius: "14px",
			padding: "14px",
			display: "flex",
			flexDirection: "column" as "column",
			transition: "0.2s ease",

			transform: hovered ? "scale(1.03)" : ""
		};
	},

	albumArt: {
		width: "100%",
		aspectRatio: 1,
		objectFit: "cover",
		borderRadius: "6%"
	},

	albumTitle: {
		...artistTitleBase,
		marginTop: "0.5rem",
		fontSize: "0.95rem",
		fontWeight: 600
	},
	albumArtist: {
		...artistTitleBase,
		marginTop: "0.25rem",
		fontSize: "0.85rem",
		color: "#9a9a9a"
	}
};
