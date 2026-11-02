import { colourScore } from "../lib/score";
import { Track } from "../musica";
import { onTrackSearchAndPlay, player } from "../Player";
import styles from "./AlbumTrack.module.css";

export default function AlbumTrack({
	track,
	trackList,
	index,
	art: showArt = false
}: {
	track: Track;
	trackList: Track[];
	index: number;
	art?: boolean;
}) {
	const durationMinutesComponent = Math.floor(track.duration / 60);
	const durationSecondsComponent = Math.floor(track.duration % 60);

	const minutesFormatted = `${durationMinutesComponent}`.padStart(2, "0");
	const secondsFormatted = `${durationSecondsComponent}`.padStart(2, "0");

	return (
		<div
			className={styles.track}

			onClick={() => {
				onTrackSearchAndPlay(track.id);

				player.setQueue(
					trackList.slice(0, index - 1),
					trackList[index],
					trackList.slice(index + 1)
				);

				player.resume();
			}}
			onContextMenu={(e) =>
				activateContextMenu(e, {
					type: "track",
					track,
					trackList,
					index
				})
			}
		>
			{showArt ? (
				<img
					className={styles.art}
					src={`/api/track/${track.id}/art`}
				/>
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
