import { colourScore } from "../lib/score";
import { Track } from "../musica";
import { ContextMenuRequiredEvent } from "./contextMenus/ContextMenu";
import styles from "./AlbumTrack.module.css";

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
	const durationMinutesComponent = Math.floor(track.duration / 60);
	const durationSecondsComponent = Math.floor(track.duration % 60);

	const minutesFormatted = `${durationMinutesComponent}`.padStart(2, "0");
	const secondsFormatted = `${durationSecondsComponent}`.padStart(2, "0");

	return (
		<div
			className={styles.track}

			onClick={() => onClick()}
			onContextMenu={(e) => onContextMenu(e)}
		>
			{showArt ? (
				<img
					className={styles.art}
					src={`/api/track/${track.id}/art`}
				></img>
			) : (
				<span className={styles.trackNumber}>
					{track.number ? track.number : ""}
				</span>
			)}

			<div className={styles.trackInfo}>
				<p className={styles.title}>{track.title}</p>
				<div className={styles.artistScoreDiv}>
					<p className={styles.artist}>{track.artist}</p>

					<p
						className={styles.score}
						style={{ color: colourScore(track.score) }}
					>
						{`${Math.round(track.score)}`}
					</p>
				</div>
			</div>

			<p
				className={styles.duration}
			>{`${minutesFormatted}:${secondsFormatted}`}</p>
		</div>
	);
}
