import { useDrag } from "@use-gesture/react";
import { useNavigate } from "react-router-dom";
import PlayerControl from "../components/PlayerControl";
import { Track } from "../musica";
import { LoopState, player, Queue } from "../Player";
import styles from "./mobile.module.css";
import { Pause, Play, SkipForward } from "@filled-lucide/react";

export default function MobilePlayer({
	track,
	isPlaying,
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
	const navigate = useNavigate();
	const showAlbum = () => navigate(`/album/${track?.albumId}`);

	const bind = useDrag(
		({
			last: dragFinished,
			movement: [, my],
			velocity: [, vy],
			direction: [, dy]
		}) => {
			if (dragFinished) {
				const isDraggingUp = dy < 0;
				const passedDistanceThreshold = my < -50;
				const passedVelocityThreshold = vy > 0.5;

				if (
					isDraggingUp &&
					(passedDistanceThreshold || passedVelocityThreshold)
				) {
					setIsFullscreen(true);
				}
			}
		}
	);

	if (track == undefined) return <></>;

	return (
		<div
			{...bind()}
			onClick={() => setIsFullscreen(true)}
			className={styles.queue}
			style={{ background: darkerColour, touchAction: "none" }}
		>
			{track ? (
				<img
					draggable={false}
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
					icon={(params) => {
						const Icon = isPlaying ? Pause : Play;

						return (
							<Icon
								color="#ffffff"
								className={params.className}
								style={params.style}
								onClick={() => player.toggle()}
								width={25}
								height={25}
							/>
						);
					}}
					width="25px"
					height="25px"
				/>
				<PlayerControl
					icon={(params) => (
						<SkipForward
							color="#ffffff"
							className={params.className}
							style={params.style}
							onClick={() => player.skipForward()}
							width={20}
							height={20}
						/>
					)}
				/>
			</div>
		</div>
	);
}
