import { LoopState, player, Queue } from "../Player";
import { Track } from "../musica";
import QueueItem from "../components/QueueItem";
import SubsetDisplay from "../components/Subset";
import ProgressBar from "../components/ProgressBar";
import PlayerControl from "../components/PlayerControl";
import styles from "./desktop.module.css";
import {
	Infinity,
	Maximize2,
	MoveRight,
	Repeat,
	RepeatOff,
	Route,
	Shuffle
} from "lucide-react";
import { Pause, Play, SkipBack, SkipForward } from "@filled-lucide/react";

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
						<PlayerControl
							icon={(params) => (
								<SkipBack
									color="#ffffff"
									className={params.className}
									style={params.style}
									onClick={() => player.skipBack()}
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
								/>
							)}
						/>
					</div>
				</div>

				<div className={styles.toolbar}>
					<LoopIcon
						color="#ffffff"
						className={styles.toolItem}
						onClick={() => player.toggleLoop()}
					/>
					{queue.isDynamic ? (
						<Route
							color="#ffffff"
							className={styles.toolItem}
							onClick={() => {}}
						/>
					) : (
						<ShuffleIcon
							color="#ffffff"
							className={styles.toolItem}
							onClick={() => player.toggleShuffle()}
						/>
					)}
					<Maximize2
						color="#ffffff"
						className={styles.toolItem}
						onClick={() => setIsFullscreen(true)}
					/>
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
