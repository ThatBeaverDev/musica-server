import { MouseEventHandler } from "react";
import { Playlist } from "../musica";
import { useNavigate } from "react-router-dom";
import styles from "./LargeAlbum.module.css";

export default function LargePlaylist({
	playlist,
	onContextMenu
}: {
	playlist: Playlist;
	onContextMenu: MouseEventHandler<HTMLDivElement>;
}) {
	const navigate = useNavigate();

	const showAlbum = () => navigate(`/playlist/${playlist.id}`);

	const total = playlist.tracks.length;

	return (
		<div
			className={styles.card}
			onContextMenu={onContextMenu}

			onClick={showAlbum}
		>
			<img
				loading="lazy"
				fetchPriority="low"
				src={`/api/playlist/${playlist.id}/art`}
				className={styles.albumArt}
			/>

			<p className={styles.albumTitle}>{playlist.name}</p>
			<p
				className={styles.albumArtist}
			>{`${total}${total == 1 ? " track" : " tracks"}`}</p>
		</div>
	);
}
