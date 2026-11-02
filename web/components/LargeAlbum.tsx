import { Album } from "../musica";
import { useNavigate } from "react-router-dom";
import styles from "./LargeAlbum.module.css";

export default function LargeAlbum({ album }: { album: Album }) {
	const navigate = useNavigate();

	const showAlbum = () => navigate(`/album/${album.id}`);

	return (
		<div
			className={styles.card}
			onContextMenu={(e) =>
				activateContextMenu(e, { type: "album", album })
			}

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
