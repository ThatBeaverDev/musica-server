import { getSubsetColour, getSubsetIcon, getSubsetName } from "./lib/subset";
import { RandomMixTrackResult, Track } from "./musica";

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

	#skipBackButton: HTMLImageElement = document.getElementById(
		"player-back"
	) as HTMLImageElement;
	#playButton: HTMLImageElement = document.getElementById(
		"player-play"
	) as HTMLImageElement;
	#skipForwardButton: HTMLImageElement = document.getElementById(
		"player-forward"
	) as HTMLImageElement;

	#queueContainer: HTMLDivElement = document.getElementById(
		"player-queue"
	)! as HTMLDivElement;

	#progressBarInner: HTMLDivElement = document.getElementById(
		"player-progress-inner"
	)! as HTMLDivElement;
	#progressBarOuter: HTMLDivElement = document.getElementById(
		"player-progress-outer"
	)! as HTMLDivElement;

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

		/* ----- Media control buttons ----- */
		this.#skipBackButton.addEventListener("mouseup", () => {
			this.skipBack();
		});
		this.#playButton.addEventListener("mouseup", () => {
			this.toggle();
		});
		this.#skipForwardButton.addEventListener("mouseup", () => {
			this.skipForward();
		});

		/* ----- Keyboard controls ----- */
		window.addEventListener("keydown", (event) => {
			switch (event.key) {
				case " ":
					this.toggle();
					event.preventDefault();
					break;
			}
		});

		/* ----- Progress bar logic ----- */

		let active = false;
		let wasPlaying = false;

		const adjustTime = (event: MouseEvent) => {
			const rect = this.#progressBarOuter.getBoundingClientRect();
			const x = event.clientX - rect.left; // x position within the element

			this.#progressBarInner.style.width = `${x}px`;

			const decimalProgression = x / rect.width;
			this.seek(this.audio.duration * decimalProgression);
		};

		this.#progressBarOuter.addEventListener("mousedown", (event) => {
			active = true;
			wasPlaying = this.isPlaying;
			this.pause();

			adjustTime(event);
		});
		window.addEventListener("mouseup", () => {
			active = false;

			if (wasPlaying) this.resume();
			// prevent unrelated clicks causing it to start playing
			wasPlaying = false;
		});
		window.addEventListener("mousemove", (event) => {
			if (!active) return;

			adjustTime(event);
		});

		const refreshProgressbar = () => {
			if (!this.#progressBarOuter || !this.#progressBarInner) return;
			const rect = this.#progressBarOuter.getBoundingClientRect();

			const decimalProgression =
				this.audio.currentTime / this.audio.duration;

			const progress = `${rect.width * decimalProgression}px`;

			if (this.#progressBarInner.style.width !== progress)
				this.#progressBarInner.style.width = progress;
		};

		setInterval(refreshProgressbar, 500);

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
			const { track: randomTrack, subset } = await getRandomMix();

			const index =
				this.queue.playlist.push({ ...randomTrack, subset }) - 1;
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

		const playerTitle = document.getElementById("player-title");
		const playerArtist = document.getElementById("player-artist");
		const playerArt = document.getElementById(
			"track-art"
		) as HTMLImageElement;
		const playerSubset = document.getElementById("player-subset");

		if (playerTitle) playerTitle.textContent = track.title;
		if (playerArtist) playerArtist.textContent = track.artist;
		if (playerArt) playerArt.src = `/api/track/${track.id}/art`;
		if (playerSubset) {
			if (track.subset) {
				const text = getSubsetName(track.subset);
				const icon = getSubsetIcon(track.subset);

				const response = await fetch(icon, { priority: "high" });
				const svg = await response.text();

				const colour = getSubsetColour(track.subset);

				playerSubset.innerHTML = `<svg class="subset-icon" viewBox="0 0 24 24">${svg}</svg>
				                          <span>${text}</span>`;
				playerSubset.style.color = colour;

				playerSubset.style.display = "";
			} else {
				playerSubset.style.display = "none";
			}
		}

		if (this.#playButton) this.#playButton.src = "/img/pause.svg";

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

	rerenderScheduled: boolean = false;
	#renderQueue() {
		if (this.rerenderScheduled || !this.#queueContainer) return;

		this.rerenderScheduled = true;
		requestAnimationFrame(() => {
			this.#queueContainer.innerHTML = "";
			debug("rebuildQueue");

			const upcomingTrackIndices = this.queue.playOrder.slice(
				this.queue.currentPlayOrderIndex + 1
			);

			if (upcomingTrackIndices.length === 0) {
				const noQueue = document.createElement("p");
				noQueue.innerText = this.queue.isDynamic
					? "Just go with the dynamic queue's flow!"
					: "Nothing queued at the moment";
				noQueue.classList.add("queue-empty-text");

				this.#queueContainer.appendChild(noQueue);
			} else {
				const frag = document.createDocumentFragment();

				let offset = 1;
				for (const playlistIndex of upcomingTrackIndices) {
					const track = this.queue.playlist[playlistIndex];
					if (!track) continue;

					const jumpAmount = offset;
					const container = document.createElement("div");
					container.classList.add("player-queue-item");

					const image = document.createElement("img");
					image.classList.add("queue-item-art");
					image.src = `/api/track/${track.id}/art`;
					image.fetchPriority = "low";
					image.loading = "lazy";

					const info = document.createElement("div");
					info.classList.add("track-info");

					const title = document.createElement("p");
					title.classList.add("album-title");
					title.textContent = track.title;

					const artist = document.createElement("p");
					artist.classList.add("album-artist");
					artist.textContent = track.artist;

					info.append(title, artist);

					container.append(image, info);

					container.addEventListener("click", async () => {
						debug("skipTo", jumpAmount);
						await this.skipForward(jumpAmount);
					});

					frag.appendChild(container);
					offset++;
				}

				this.#queueContainer.appendChild(frag);
			}

			this.rerenderScheduled = false;
		});
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

		if (this.#playButton) this.#playButton.src = "/img/play.svg";
		this.audio.pause();
	}

	async resume() {
		debug("resume");

		if (!this.queue.isDynamic && this.queue.playOrder.length === 0) return;

		if (!this.currentInitiated) {
			await this.rollover(1);
		} else {
			if (this.#playButton) this.#playButton.src = "/img/pause.svg";
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
		if (this.#playButton) this.#playButton.src = "/img/play.svg";
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
player.onTrackPlayed = (track) => {
	fetch(`/api/track/${track.id}/played`);
};
player.onTrackSkipped = (track) => {
	fetch(`/api/track/${track.id}/skipped`);
};

export function onTrackSearchAndPlay(id: string) {
	fetch(`/api/track/${id}/explicitPlay`);
}
