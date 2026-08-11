import { useState } from "react";
import { RandomMixTrackResult, Track } from "./musica";
import SubsetDisplay from "./components/Subset";
import QueueItem from "./components/QueueItem";
import ProgressBar from "./components/ProgressBar";
import PlayerControl from "./components/PlayerControl";

const willDebug = true;
function debug(...data: any[]) {
	if (willDebug) console.debug(...data);
}

export enum LoopState {
	none = 0,
	one = 1,
	all = 2
}

interface StandardQueue {
	readonly isDynamic: false;

	readonly loop: LoopState;
	readonly shuffle: boolean;

	playlist: Track[];
	playOrder: number[];

	currentPlayOrderIndex: number;
}

interface DynamicQueue {
	readonly isDynamic: true;

	readonly loop: LoopState;

	playlist: Track[];
	playOrder: number[];

	currentPlayOrderIndex: number;
}

type Queue = StandardQueue | DynamicQueue;

async function getRandomMix() {
	const nextIdFetch = await fetch("/api/tracks/randomMixTrack", {
		priority: "high"
	});
	const { id, subset }: RandomMixTrackResult = await nextIdFetch.json();

	const trackFetch = await fetch(`/api/track/${id}/info`, {
		priority: "high"
	});
	const track: Track = await trackFetch.json();

	return { track, subset };
}

class AudioPlayer {
	audio: HTMLAudioElement;

	queue: Queue = {
		isDynamic: false,

		loop: LoopState.none,
		shuffle: false,

		playlist: [],
		playOrder: [],

		currentPlayOrderIndex: 0
	};

	currentInitiated: boolean = false;

	// Callbacks
	// current track played fully
	onTrackPlayed?: (track: Track) => void;
	// user skipped this track when it was playing
	onTrackSkipped?: (
		track: Track,
		secondsPlayed: number,
		duration: number
	) => void;

	// for updating the UI
	onTrackUpdate?: (track: Track) => void;
	onQueueUpdate?: (queue: Queue) => void;
	onProgressBarUpdate?: (current: number, duration: number) => void;
	onPlaybackStateChange?: (isPlaying: boolean) => void;

	constructor(audio?: HTMLAudioElement) {
		this.audio =
			audio ??
			(document.querySelector("audio#player") as HTMLAudioElement);

		/* ----- Audio rollover when finished ----- */

		this.audio.addEventListener("ended", () => {
			// broadcast finish
			if (this.currentTrack) {
				debug("Event: Track played to 100%", this.currentTrack);
				this.onTrackPlayed?.(this.currentTrack);
			}

			if (navigator.mediaSession) {
				navigator.mediaSession.metadata = null;
			}

			this.rollover();
		});

		/* ----- Keyboard controls ----- */
		window.addEventListener("keydown", (event) => {
			if (document.activeElement instanceof HTMLInputElement) return; // don't catch spaces there

			switch (event.key) {
				case " ":
					this.toggle();
					event.preventDefault();
					break;
			}
		});

		this.#renderQueue();

		// media session
		if (navigator.mediaSession) {
			navigator.mediaSession.setActionHandler("play", () =>
				this.resume()
			);
			navigator.mediaSession.setActionHandler("pause", () =>
				this.pause()
			);
			navigator.mediaSession.setActionHandler("nexttrack", () =>
				this.skipForward()
			);
			navigator.mediaSession.setActionHandler("previoustrack", () =>
				this.skipBack()
			);
			navigator.mediaSession.setActionHandler("stop", () => this.stop());
		}
	}

	get currentTrack(): Track | undefined {
		return this.queue.playlist[
			this.queue.playOrder[this.queue.currentPlayOrderIndex]
		];
	}

	async #insureDynamicQueueLength() {
		if (!this.queue.isDynamic) return;

		const targetLastIndex = this.queue.currentPlayOrderIndex + 15;
		const targetLength = targetLastIndex + 1;
		let added = false;

		while (this.queue.playlist.length < targetLength) {
			const { track: randomTrack } = await getRandomMix();

			const index = this.queue.playlist.push(randomTrack) - 1;
			this.queue.playOrder.push(index);

			added = true;
		}

		if (added) this.#renderQueue();
	}

	async #getNextTrack(number: number): Promise<Track | undefined> {
		await this.#insureDynamicQueueLength();

		switch (this.queue.loop) {
			case LoopState.one:
				return this.currentTrack;

			case LoopState.none:
				this.queue.currentPlayOrderIndex += number;
				this.currentInitiated = false;

				if (
					this.queue.currentPlayOrderIndex < 0 ||
					this.queue.currentPlayOrderIndex >=
						this.queue.playOrder.length
				) {
					return undefined;
				}

				return this.currentTrack;

			case LoopState.all:
				const len = this.queue.playOrder.length;
				if (len === 0) return undefined;

				this.queue.currentPlayOrderIndex =
					(((this.queue.currentPlayOrderIndex + number) % len) +
						len) %
					len;

				this.currentInitiated = false;

				return this.currentTrack;
		}
	}

	async rollover(number: number = 1) {
		const next = await this.#getNextTrack(number);

		debug("next", next);

		if (!next) {
			this.stop();
			this.resetQueue();
			return;
		}

		this.#renderQueue();
		await this.#playTrack(next);
	}

	async #playTrack(track: Track) {
		this.currentInitiated = true;

		await this.#insureDynamicQueueLength();
		this.onTrackUpdate?.(track);

		if (navigator.mediaSession && window.MediaMetadata) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: track.title,
				artist: track.artist,
				album: track.album,
				artwork: [
					{
						src: `/api/track/${track.id}/art`,
						type: "image/png"
					}
				]
			});
		}

		this.audio.src = `/api/track/${track.id}/get`;

		this.onPlaybackStateChange?.(true);

		try {
			await this.audio.play();
		} catch (err) {
			console.error(err);
		}
	}

	resetQueue() {
		debug("reset");
		this.stop();

		this.queue = {
			isDynamic: false,

			loop: LoopState.none,
			shuffle: false,

			playlist: [],
			playOrder: [],

			currentPlayOrderIndex: 0
		};
		this.currentInitiated = false;

		this.#renderQueue();
	}

	#renderQueue() {
		this.onQueueUpdate?.(this.queue);
	}

	addToQueue(track: Track) {
		debug("add", track);

		if (this.queue.isDynamic) return;

		this.queue.playlist.push(track);
		const index = this.queue.playlist.length - 1;
		this.queue.playOrder.push(index);

		this.#renderQueue();
	}

	setQueue(
		before: Track[],
		now: Track,
		after: Track[],
		shuffle: boolean = false
	) {
		this.resetQueue();

		const playlist = [...before, now, ...after];

		this.queue = {
			isDynamic: false,

			playlist,
			playOrder: playlist.map((_, i) => i),

			// Position right before the 'now' track so rollover(1) lands on it
			currentPlayOrderIndex: before.length - 1,

			loop: LoopState.none,
			shuffle: false
		};

		this.currentInitiated = false;
		if (shuffle) this.toggleShuffle();

		this.#renderQueue();
	}

	startDynamicQueue() {
		this.resetQueue();

		this.queue = {
			isDynamic: true,

			loop: LoopState.none,

			playlist: [],
			playOrder: [],

			currentPlayOrderIndex: 0
		};

		this.#renderQueue();
	}

	pause() {
		debug("pause");

		this.onPlaybackStateChange?.(false);
		this.audio.pause();
	}

	async resume() {
		debug("resume");

		if (!this.queue.isDynamic && this.queue.playOrder.length === 0) return;

		if (!this.currentInitiated) {
			await this.rollover(1);
		} else {
			this.onPlaybackStateChange?.(true);
			await this.audio.play();
		}

		this.#renderQueue();
	}

	toggle() {
		if (this.audio.paused) {
			debug("toggle (playing)");
			this.resume();
		} else {
			debug("toggle (pausing)");
			this.pause();
		}
	}

	#setLoopState(state: LoopState) {
		// @ts-expect-error // this is an intended way to modify
		this.queue.loop = state;
	}

	toggleLoop() {
		switch (this.queue.loop) {
			case LoopState.none:
				debug("Toggling Loop (Setting all)");
				this.#setLoopState(LoopState.all);
				break;

			case LoopState.all:
				debug("Toggling Loop (Setting one)");
				this.#setLoopState(LoopState.one);
				break;

			case LoopState.one:
				debug("Toggling Loop (Setting off)");
				this.#setLoopState(LoopState.none);
				break;
		}
	}

	#setShuffleState(state: boolean) {
		if (this.queue.isDynamic || this.queue.shuffle === state) return;

		function shuffleArray<T>(array: T[]): T[] {
			let currentIndex = array.length;
			while (currentIndex !== 0) {
				let randomIndex = Math.floor(Math.random() * currentIndex);
				currentIndex--;
				[array[currentIndex], array[randomIndex]] = [
					array[randomIndex],
					array[currentIndex]
				];
			}
			return array;
		}

		if (state) {
			const currentTrack = this.currentTrack;
			// clean clone
			const cleanIndices = this.queue.playlist.map((_, i) => i);

			const currentPlaylistIndex = currentTrack
				? this.queue.playlist.indexOf(currentTrack)
				: 0;

			// remove the current index and shuffle
			const remaining = cleanIndices.filter(
				(i) => i !== currentPlaylistIndex
			);
			const shuffledRemaining = shuffleArray(remaining);

			// rebuild playOrder
			this.queue.playOrder = [currentPlaylistIndex, ...shuffledRemaining];
			this.queue.currentPlayOrderIndex = 0;

			// @ts-expect-error // this is an intended way to modify
			this.queue.shuffle = true;
		} else {
			const track = this.currentTrack;

			if (track) {
				this.queue.currentPlayOrderIndex =
					this.queue.playlist.indexOf(track);
			}

			this.queue.playOrder = this.queue.playlist.map((_, i) => i);

			// @ts-expect-error // this is an intended way to modify
			this.queue.shuffle = false;
		}
		this.#renderQueue();
	}

	toggleShuffle() {
		if (this.queue.isDynamic) return;

		if (this.queue.shuffle) {
			debug("Toggling Shuffle (Setting off)");
			this.#setShuffleState(false);
		} else {
			debug("Toggling Shuffle (Setting on)");
			this.#setShuffleState(true);
		}
	}

	async skipBack() {
		debug("back");

		if (this.audio.currentTime > 5 || this.queue.loop === LoopState.one) {
			this.audio.currentTime = 0;
			return;
		}

		await this.rollover(-1);
	}

	async skipForward(number: number = 1) {
		debug("next (user action)");

		const current = this.currentTrack;
		if (current && !this.audio.ended) {
			debug("Event: track manually skipped", current);
			this.onTrackSkipped?.(
				current,
				this.audio.currentTime,
				this.audio.duration
			);
		}

		this.audio.pause();
		this.audio.currentTime = 0;
		await this.rollover(number);
	}

	stop() {
		debug("stop");

		this.audio.pause();
		this.audio.currentTime = 0;
		this.onPlaybackStateChange?.(false);
	}

	seek(seconds: number) {
		debug("seek to", seconds);

		this.audio.currentTime = seconds;
	}

	set volume(volume: number) {
		debug("setVolume", volume);
		this.audio.volume = Math.max(0, Math.min(1, volume));
	}

	get volume(): number {
		return this.audio.volume;
	}

	get isPlaying() {
		debug("playingQuery");
		return !this.audio.paused;
	}
}

export const player = new AudioPlayer();
// @ts-expect-error
globalThis.player = player;
player.onTrackPlayed = (track) => {
	fetch(`/api/track/${track.id}/played`);
};
player.onTrackSkipped = (track) => {
	fetch(`/api/track/${track.id}/skipped`);
};

export function onTrackSearchAndPlay(id: string) {
	fetch(`/api/track/${id}/explicitPlay`);
}

export default function Player({ mobile }: { mobile: boolean }) {
	const [track, setTrack] = useState(player.currentTrack);
	player.onTrackUpdate = setTrack;

	const [queue, setQueue] = useState(player.queue);
	player.onQueueUpdate = setQueue;

	const [isPlaying, setIsPlaying] = useState(player.isPlaying);
	player.onPlaybackStateChange = setIsPlaying;

	const playlist = queue.playOrder
		.slice(queue.currentPlayOrderIndex + 1)
		.map((index) => queue.playlist[index]);

	return (
		<div style={styles.queue(mobile)}>
			<div style={styles.player(mobile)}>
				{track ? (
					<div style={styles.trackArtContainer(mobile)}>
						<img
							style={styles.trackArt}
							src={`/api/track/${track?.id}/art`}
						/>
					</div>
				) : undefined}

				<div style={styles.playerInfo}>
					<p style={styles.trackTitle} id="player-title">
						{track?.title ?? "Nothing is playing."}
					</p>
					<p style={styles.trackArtist} id="player-artist">
						{track?.artist ?? ""}
					</p>
					{track?.subset ? (
						<SubsetDisplay subset={track.subset}></SubsetDisplay>
					) : undefined}

					<ProgressBar />

					<div style={styles.playerControls}>
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
			</div>

			<div>
				{playlist.length == 0 ? (
					<p style={styles.queueEmptyText}>
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

const styles = {
	queue(mobile: boolean) {
		if (mobile) {
			return {
				width: "100dvw",
				height: "40dvw",

				padding: "24px",
				background: "#181818",
				borderTop: "1px solid rgba(255, 255, 255, 0.06)",

				overflowX: "hidden" as "hidden",
				overflowY: "scroll" as "scroll"
			};
		} else {
			return {
				width: "260px",
				height: "100%",

				padding: "24px",
				paddingTop: "0px",
				background: "#181818",
				borderTop: "1px solid rgba(255, 255, 255, 0.06)",

				overflowX: "hidden" as "hidden",
				overflowY: "scroll" as "scroll"
			};
		}
	},

	player(mobile: boolean) {
		return {
			width: "100%",

			display: "flex",
			flexDirection: mobile ? ("row" as "row") : ("column" as "column"),

			alignItems: "center",
			margin: "20px 0px"
		};
	},

	trackArtContainer(mobile: boolean) {
		if (mobile) {
			return { width: "15dvh", height: "15dvh", paddingRight: "10px" };
		} else {
			return {
				width: "100%",
				aspectRatio: "1/1",
				minHeight: 0,
				paddingRight: "10px"
			};
		}
	},
	trackArt: { width: "100%", height: "100%", borderRadiud: "6%" },

	playerInfo: {
		display: "flex",
		flexDirection: "column" as "column",
		alignItems: "center",

		margin: "5px",

		gap: "2px",
		flex: 1
	},
	playerControls: {
		display: "flex",
		flexDirection: "row" as "row",
		justifyContent: "center" as "center",
		alignItems: "center" as "center",

		width: "100%"
	},

	trackTitle: {
		fontSize: "1.5rem",
		fontWeight: 500,
		color: "white",
		textAlign: "center" as "center"
	},
	trackArtist: {
		fontSize: "0.9rem",
		color: "#888",
		textAlign: "center" as "center"
	},

	queueEmptyText: {
		userSelect: "none" as "none",
		width: "100%",
		textAlign: "center" as "center"
	}
};
