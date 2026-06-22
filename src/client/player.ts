import { Track } from "../index/indexer";

const willDebug = true;
function debug(...data: any[]) {
	if (willDebug) console.debug(...data);
}

class AudioPlayer {
	audio: HTMLAudioElement;
	currentTrack?: Track;
	queue: {
		loop: "one" | "all" | "none";
		readonly shuffle: boolean;
		nextTracks: Track[];
		pastTracks: Track[];
	} = { loop: "none", shuffle: false, nextTracks: [], pastTracks: [] };

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

	constructor(audio?: HTMLAudioElement) {
		this.audio =
			audio ??
			(document.querySelector("audio#player") as HTMLAudioElement);

		this.audio.addEventListener("ended", () => this.rollover());

		this.#skipBackButton.addEventListener("mouseup", () => {
			this.skipBack();
		});
		this.#playButton.addEventListener("mouseup", () => {
			this.toggle();
		});
		this.#skipForwardButton.addEventListener("mouseup", () => {
			this.skipForward();
		});

		this.#renderQueue();
	}

	#getNextTrack(): Track | undefined {
		switch (this.queue.loop) {
			case "one":
				return this.currentTrack;

			case "none":
				return this.queue.nextTracks.shift();

			case "all":
				if (this.queue.nextTracks.length === 0) {
					this.queue.nextTracks = []; // insure not linked
					this.queue.pastTracks.forEach((item) => {
						this.addToQueue(item);
					});
					this.queue.pastTracks = [];
				}

				return this.queue.nextTracks.shift();
		}
	}

	async rollover() {
		const next = this.#getNextTrack();

		if (!next) {
			this.resetQueue();
			return;
		}

		if (this.currentTrack && this.queue.loop !== "one") {
			this.queue.pastTracks.push(this.currentTrack);
		}

		this.#renderQueue();
		await this.#playTrack(next);
	}

	async #playTrack(track: Track) {
		this.currentTrack = track;

		this.audio.src = `/api/track/${track.id}/get`;

		document.getElementById("player-title")!.textContent = track.title;
		document.getElementById("player-artist")!.textContent = track.artist;
		(document.getElementById("track-art") as HTMLImageElement).src =
			`/api/track/${track.id}/art`;

		this.#playButton.src = "/img/pause.svg";

		try {
			await this.audio.play();
		} catch (err) {
			console.error(err);
		}
	}

	resetQueue() {
		debug("reset");
		this.currentTrack = undefined;
		this.stop();

		this.queue = {
			loop: "none",
			shuffle: false,
			nextTracks: [],
			pastTracks: []
		};

		this.#renderQueue();
	}

	#renderQueue() {
		this.#queueContainer.innerHTML = "";

		if (this.queue.nextTracks.length === 0) {
			const noQueue = document.createElement("p");
			noQueue.innerText = "Nothing queued at the moment";
			noQueue.classList.add("queue-empty-text");

			this.#queueContainer.appendChild(noQueue);

			return;
		}

		let i = 0;
		for (const track of this.queue.nextTracks) {
			i++;

			const container = document.createElement("div");
			container.classList.add("player-queue-item");

			const image = document.createElement("img");
			image.classList.add("queue-item-art");
			image.src = `/api/track/${track.id}/art`;

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

			container.addEventListener("mouseup", async () => {
				for (let times = 0; times > i; times++) {
					await this.skipForward();
				}
			});

			this.#queueContainer.appendChild(container);
		}
	}

	addToQueue(track: Track) {
		debug("add", track);

		this.queue.nextTracks.push(track);
		this.#renderQueue();
	}

	setQueue(before: Track[], now: Track, after: Track[]) {
		this.resetQueue();

		this.queue.pastTracks = [...before];
		this.queue.nextTracks = [now, ...after];

		this.#renderQueue();
	}

	pause() {
		debug("pause");

		this.#playButton.src = "/img/play.svg";
		this.audio.pause();
	}

	async resume() {
		debug("resume");

		if (!this.currentTrack) await this.rollover();

		this.#playButton.src = "/img/pause.svg";
		await this.audio.play();

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

	async skipBack() {
		if (this.audio.currentTime > 5) {
			this.audio.currentTime = 0;
			return;
		}

		const previous = this.queue.pastTracks.pop();

		if (!previous) {
			this.audio.currentTime = 0;
			return;
		}

		if (this.currentTrack) {
			this.queue.nextTracks.unshift(this.currentTrack);
		}

		await this.#playTrack(previous);
	}

	async skipForward() {
		this.audio.pause();
		this.audio.currentTime = 0;
		await this.rollover();
	}

	stop() {
		debug("stop");
		this.audio.pause();
		this.audio.currentTime = 0;
		this.#playButton.src = "/img/play.svg";
	}

	seek(seconds: number) {
		debug("seek to", seconds);
		this.audio.currentTime = seconds;
	}

	set volume(volume: number) {
		debug("setVolume", volume);
		this.audio.volume = Math.max(0, Math.min(1, volume));
	}

	get isPlaying() {
		debug("playingQuery");
		return !this.audio.paused;
	}
}

export const player = new AudioPlayer();
