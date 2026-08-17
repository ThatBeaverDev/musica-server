import { Track } from "../musica";
import { LoopState, player, Queue } from "../Player";
import PlayerControl from "../components/PlayerControl";
import styles from "./mobile.module.css";
import { useNavigate } from "react-router-dom";

export default function MobilePlayer({
	track,
	isPlaying,
	darkerColour
}: {
	track: Track | undefined;
	queue: Queue;
	shuffle: boolean;
	loop: LoopState;
	isPlaying: boolean;
	playlist: Track[];
	trackColour?: string;
	darkerColour?: string;
	setIsFullscreen: (fullscreen: boolean) => void;
}) {
	const navigate = useNavigate();
	const showAlbum = () => navigate(`/album/${track?.albumId}`);

	return (
		<div className={styles.queue} style={{ background: darkerColour }}>
			{track ? (
				<img
					className={styles.trackArt}
					src={`/api/track/${track?.id}/art`}
					onClick={showAlbum}
				/>
			) : (
				<div className={styles.trackArt} />
			)}

			<div className={styles.properties}>
				<p className={styles.trackTitle}>
					{track?.title ?? "Nothing is playing."}
				</p>

				<p className={styles.trackArtist}>{track?.artist ?? ""}</p>
			</div>

			<div className={styles.playerControls}>
				<PlayerControl
					src={isPlaying ? "/img/pause.svg" : "/img/play.svg"}
					onClick={() => player.toggle()}
					width="25px"
					height="25px"
				/>
				<PlayerControl
					src="/img/skip-forward.svg"
					onClick={() => player.skipForward()}
					width="20px"
					height="20px"
				/>
			</div>
		</div>
	);
}
