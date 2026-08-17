import { LoopState, player, Queue } from "../Player";
import { Track } from "../musica";
import QueueItem from "../components/QueueItem";
import SubsetDisplay from "../components/Subset";
import ProgressBar from "../components/ProgressBar";
import PlayerControl from "../components/PlayerControl";
import styles from "./desktop.module.css";

export default function DesktopPlayer({
	track,
	queue,
	shuffle,
	loop,
	isPlaying,
	playlist,
	trackColour,
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
			className={styles.queue}
			style={{
				background:
					trackColour && darkerColour
						? `linear-gradient(to bottom, ${trackColour}, ${darkerColour} 400px`
						: "#181818"
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
					</div>
				</div>

				<div className={styles.toolbar}>
					<img
						className={styles.toolItem}
						src={loopIcon}
						onClick={() => player.toggleLoop()}
					></img>
					{queue.isDynamic ? undefined : (
						<img
							className={styles.toolItem}
							src={shuffleIcon}
							onClick={() => player.toggleShuffle()}
						></img>
					)}
					<img
						className={styles.toolItem}
						src="/img/maximise.svg"
						onClick={() => setIsFullscreen(true)}
					></img>
				</div>
			</div>

			<div>
				{playlist.length == 0 ? (
					<p className={styles.queueEmptyText}>
						{queue.isDynamic
							? "Just go with the dynamic queue's flow!"
							: "Nothing queued at the moment."}
					</p>
				) : (
					playlist.map((entry, index) => (
						<QueueItem
							key={index}
							track={entry}
							offset={index + 1}
						/>
					))
				)}
			</div>
		</div>
	);
}
