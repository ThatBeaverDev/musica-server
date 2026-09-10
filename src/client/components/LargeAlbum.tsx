import { MouseEventHandler } from "react";
import { Album } from "../musica";
import { useNavigate } from "react-router-dom";
import styles from "./LargeAlbum.module.css";

export default function LargeAlbum({
	album,
	onContextMenu
}: {
	album: Album;
	onContextMenu: MouseEventHandler<HTMLDivElement>;
}) {
	const navigate = useNavigate();

	const showAlbum = () => navigate(`/album/${album.id}`);

	return (
		<div
			className={styles.card}
			onContextMenu={onContextMenu}

			onClick={showAlbum}
		>
			<img
				loading="lazy"
				fetchPriority="low"
				src={`/api/album/${album.id}/art`}
				className={styles.albumArt}
			/>

			<p className={styles.albumTitle}>{album.title}</p>
			<p className={styles.albumArtist}>{album.artist}</p>
		</div>
	);
}
