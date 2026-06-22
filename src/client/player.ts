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

	constructor(audio?: HTMLAudioElement) {
		this.audio =
			audio ??
			(document.querySelector("audio#player") as HTMLAudioElement);

		this.audio.addEventListener("ended", () => this.rollover());
	}

	async rollover() {
		debug("rollover");
		let track: Track;

		const halt = () => {
			this.currentTrack = undefined;
			this.pause();
			this.resetQueue();
		};

		switch (this.queue.loop) {
			case "none":
				[track] = this.queue.nextTracks.splice(0, 1);

				if (!track) {
					halt();
					return;
				}
				break;

			case "one":
				if (this.currentTrack) {
					track = this.currentTrack;
				} else {
					halt();
					return; // no queue
				}
				break;

			case "all":
				[track] = this.queue.nextTracks.splice(0, 1);

				if (!track) {
					halt();

					this.queue.nextTracks = this.queue.pastTracks;
					[track] = this.queue.nextTracks.splice(0, 1);
				}

				break;
		}

		this.queue.pastTracks.push(track);

		this.currentTrack = track;
		this.audio.src = `/api/track/${track.id}/get`;

		document.querySelector(
			"body > div.main > div.player > div > p.album-title"
		)!.textContent = track.title;

		document.querySelector(
			"body > div.main > div.player > div > p.album-artist"
		)!.textContent = track.artist;

		(document.getElementById("track-art")! as HTMLImageElement).src =
			`/api/track/${track.id}/art`;

		try {
			await this.audio.play();
		} catch (err) {
			console.error("Playback failed:", err);
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
	}

	async addToQueue(track: Track) {
		debug("add", track);
		this.queue.nextTracks.push(track);
	}

	pause() {
		debug("pause");
		this.audio.pause();
	}

	async resume() {
		debug("resume");

		if (!this.currentTrack) await this.rollover();

		await this.audio.play();
	}

	toggle() {
		if (this.audio.paused) {
			debug("toggle (playing)");
			this.audio.play();
		} else {
			debug("toggle (pausing)");
			this.audio.pause();
		}
	}

	stop() {
		debug("stop");
		this.audio.pause();
		this.audio.currentTime = 0;
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
