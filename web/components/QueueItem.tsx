import { Track } from "../musica";
import { player } from "../Player";
import styles from "./QueueItem.module.css";

export default function QueueItem({
	track,
	offset
}: {
	track: Track;
	offset: number;
}) {
	return (
		<div
			className={styles.queueItem}

			onClick={() => player.skipForward(offset)}
			onContextMenu={(e) =>
				activateContextMenu(e, {
					type: "track",
					track,
					allowPlay: false
				})
			}
		>
			<img className={styles.art} src={`/api/track/${track.id}/art`} />

			<div className={styles.trackInfo}>
				<p className={styles.title}>{track.title}</p>
				<p className={styles.artist}>{track.artist}</p>
			</div>
		</div>
	);
}
