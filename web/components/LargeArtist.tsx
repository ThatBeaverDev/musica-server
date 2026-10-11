import { MouseEventHandler } from "react";
import { Artist } from "../musica";
import { useNavigate } from "react-router-dom";
import styles from "./LargeArtist.module.css";

export default function LargeArtist({
	artist,
	onContextMenu
}: {
	artist: Artist;
	onContextMenu: MouseEventHandler<HTMLDivElement>;
}) {
	const navigate = useNavigate();

	const showArtist = () => navigate(`/album/${artist.id}`);

	return (
		<div
			className={styles.card}
			onContextMenu={onContextMenu}

			onClick={showArtist}
		>
			<img
				loading="lazy"
				fetchPriority="low"
				src={`/api/artist/${artist.id}/art`}
				className={styles.artistPicture}
			/>

			<p className={styles.artistName}>{artist.name}</p>
			<p
				className={styles.albumCount}
			>{`${artist.albums.length} Album${artist.albums.length == 0 ? "" : "s"}`}</p>
		</div>
	);
}
