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
import {
	Infinity,
	MoveRight,
	Repeat,
	RepeatOff,
	Route,
	Shuffle
} from "lucide-react";
import { Pause, Play, SkipBack, SkipForward } from "@filled-lucide/react";

export default function FullscrenPlayer({
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

	const LoopIcon = (() => {
		switch (loop) {
			case LoopState.none:
				return RepeatOff;

			case LoopState.one:
				return Infinity;

			case LoopState.all:
				return Repeat;
		}
	})();

	const ShuffleIcon = shuffle ? Shuffle : MoveRight;

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
							<Route
								color="#ffffff"
								className={toolStyleObj.toolItem}
								onClick={() => {}}
							/>
						) : (
							<ShuffleIcon
								color="#ffffff"
								className={toolStyleObj.toolItem}
								onClick={() => player.toggleShuffle()}
							/>
						)}
						<PlayerControl
							icon={(params) => (
								<SkipBack
									color="#ffffff"
									className={params.className}
									style={params.style}
									onClick={() => player.skipBack()}
									width={30}
									height={30}
								/>
							)}
						/>
						<PlayerControl
							icon={(params) => {
								const Icon = isPlaying ? Pause : Play;

								return (
									<Icon
										color="#ffffff"
										className={params.className}
										style={params.style}
										onClick={() => player.toggle()}
										width={40}
										height={40}
									/>
								);
							}}
							width="40px"
							height="40px"
						/>
						<PlayerControl
							icon={(params) => (
								<SkipForward
									color="#ffffff"
									className={params.className}
									style={params.style}
									onClick={() => player.skipForward()}
									width={30}
									height={30}
								/>
							)}
						/>
						<LoopIcon
							color="#ffffff"
							className={toolStyleObj.toolItem}
							onClick={() => player.toggleLoop()}
						/>
					</div>
				</div>
			</div>

			<div className={styles.queue}>
				{playlist.map((track, index) => (
					<QueueItem track={track} offset={index + 1} />
				))}
			</div>
		</div>
	);
}
