import { useRef } from "react";
import { useDrag } from "@use-gesture/react";
import { LoopState, player, Queue } from "../Player";
import PlayerControl from "../components/PlayerControl";
import ProgressBar from "../components/ProgressBar";
import SubsetDisplay from "../components/Subset";
import { Track } from "../musica";
import styles from "./fullscreen.module.css";
import QueueItem from "../components/QueueItem";
import toolStyleObj from "./desktop.module.css";

export default function DesktopPlayer({
	track,
	queue,
	loop,
	shuffle,
	isPlaying,
	playlist,
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
	const containerRef = useRef<HTMLDivElement | null>(null);

	useDrag(
		({
			event,
			last,
			movement: [, my],
			velocity: [, vy],
			direction: [, dy],
			cancel
		}) => {
			const isAtTop = containerRef.current
				? containerRef.current.scrollTop <= 0
				: true;

			// Lock native pull-to-refresh when dragging down at top of scroll
			if (isAtTop && my > 0) {
				if (event.cancelable) {
					event.preventDefault();
				}
			} else if (!isAtTop) {
				cancel();
				return;
			}

			if (last) {
				const isDraggingDown = dy > 0;
				const passedDistanceThreshold = my > 80;
				const passedVelocityThreshold = vy > 0.5;

				if (
					isDraggingDown &&
					(passedDistanceThreshold || passedVelocityThreshold)
				) {
					setIsFullscreen(false);
				}
			}
		},
		{
			target: containerRef,
			eventOptions: { passive: false },
			filterTaps: true
		}
	);

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
			ref={containerRef}
			className={styles.container}
			style={{
				backgroundColor: darkerColour,
				touchAction: "pan-y"
			}}
		>
			<div className={styles.header}>
				<div className={styles.pullTab}></div>
			</div>

			<div className={styles.player}>
				{track ? (
					<div className={styles.trackArtContainer}>
						<img
							draggable={false}
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
								className={toolStyleObj.toolItem}
								src={"/img/dynamic-queue.svg"}
							/>
						) : (
							<img
								className={toolStyleObj.toolItem}
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
							className={toolStyleObj.toolItem}
							src={loopIcon}
							onClick={() => player.toggleLoop()}
						/>
					</div>
				</div>
			</div>

			<div className={styles.queue}>
				{playlist.map((track, index) => (
					<QueueItem track={track} offset={index} />
				))}
			</div>
		</div>
	);
}
