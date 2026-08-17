import { LoopState, player, Queue } from "../Player";
import PlayerControl from "../components/PlayerControl";
import ProgressBar from "../components/ProgressBar";
import SubsetDisplay from "../components/Subset";
import { Track } from "../musica";
//import QueueItem from "../components/QueueItem";
//import SubsetDisplay from "../components/Subset";
//import ProgressBar from "../components/ProgressBar";
//import PlayerControl from "../components/PlayerControl";
import styles from "./fullscreen.module.css";

export default function DesktopPlayer({
	track,
	queue,
	loop,
	shuffle,
	isPlaying,
	//playlist,
	//trackColour,
	darkerColour,
	setIsFullscreen
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
	const loopIcon = (() => {
		switch (loop) {
			case LoopState.none:
				return "/img/no-loop.svg";

			case LoopState.one:
				return "/img/loop-1.svg";

			case LoopState.all:
				return "/img/loop.svg";
		}
	})();

	const shuffleIcon = queue.isDynamic
		? ""
		: shuffle
			? "/img/shuffle.svg"
			: "/img/no-shuffle.svg";

	return (
		<div
			className={styles.container}
			style={{
				backgroundColor: darkerColour
			}}
		>
			<div className={styles.player}>
				{track ? (
					<div className={styles.trackArtContainer}>
						<img
							className={styles.trackArt}
							src={`/api/track/${track?.id}/art`}
						/>
					</div>
				) : undefined}
				<div className={styles.playerInfo}>
					<p className={styles.trackTitle}>
						{track?.title ?? "Nothing is playing."}
					</p>
					<p className={styles.trackArtist}>{track?.artist ?? ""}</p>
					{track?.subset ? (
						<SubsetDisplay subset={track.subset}></SubsetDisplay>
					) : undefined}

					<ProgressBar />

					<div className={styles.playerControls}>
						{queue.isDynamic ? (
							<img
								className={styles.toolIndicator}
								src={"/img/dynamic-queue.svg"}
							/>
						) : (
							<img
								className={styles.toolItem}
								src={shuffleIcon}
								onClick={() => player.toggleShuffle()}
							/>
						)}
						<PlayerControl
							src="/img/skip-back.svg"
							onClick={() => player.skipBack()}
						/>
						<PlayerControl
							src={isPlaying ? "/img/pause.svg" : "/img/play.svg"}
							onClick={() => player.toggle()}
							width="40px"
							height="40px"
						/>
						<PlayerControl
							src="/img/skip-forward.svg"
							onClick={() => player.skipForward()}
						/>
						<img
							className={styles.toolItem}
							src={loopIcon}
							onClick={() => player.toggleLoop()}
						/>
					</div>
				</div>
				<div className={styles.toolbar}>
					<img
						className={styles.toolItem}
						src="/img/minimise.svg"
						onClick={() => setIsFullscreen(false)}
					/>
				</div>
			</div>

			<div className={styles.queue}>queue</div>
		</div>
	);
}
