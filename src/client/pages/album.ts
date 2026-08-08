import { colourScore } from "../lib/score.js";
import { Album } from "../musica.js";
import { onTrackSearchAndPlay, player } from "../player.js";

export default async function album(
	div: HTMLDivElement,
	aborteeFunction: {
		abort: () => void;
	}
) {
	aborteeFunction.abort();

	div.innerHTML = `
        <div class="hero">
            <img id="art" class="cover" />

            <div class="hero-info">
                <p class="label">Album</p>
                <h1 id="title">Loading Album...</h1>
                <p id="artist-release"></p>
                <p id="score"></p>
            </div>
        </div>

        <div class="section">
            <h3>Tracks</h3>
            <div class="trackList" id="trackList"></div>
        </div>`;

	document.title = `Album - Musica`;

	const id = new URL(window.location.href).pathname.split("/")[2];
	const album: Album = await (
		await fetch(`/api/album/${id}/info`, { priority: "high" })
	).json();

	document.title = `${album.title} by ${album.artist} - Musica`;

	const title = document.getElementById("title")!;
	title.innerText = album.title;

	const artistAndRelease = document.getElementById("artist-release")!;
	artistAndRelease.innerText = album.artist;
	if (album.release)
		artistAndRelease.innerText += ` (${new Date(album.release).getFullYear()})`;

	const score = document.getElementById("score")!;
	score.innerText = `Score: ${Math.round(album.score)}`;
	score.style.color = colourScore(album.score);

	const art = document.getElementById("art")! as HTMLImageElement;
	art.src = `/api/track/${album.tracks[0].id}/art`;

	album.tracks.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

	const tracksContainer = document.getElementById("trackList")!;
	let i = 1;
	for (const index in album.tracks) {
		const idx = Number(index);
		const info = album.tracks[idx];

		const div = document.createElement("div");
		div.classList.add("listTerm");

		const span = document.createElement("span");
		span.classList.add("track-number");
		span.innerText = `${i++}`;
		div.appendChild(span);

		const infoDiv = document.createElement("div");
		infoDiv.classList.add("track-info");

		const albumTitle = document.createElement("p");
		albumTitle.classList.add("album-title");
		albumTitle.innerText = info.title;

		const artistAndScoreDiv = document.createElement("div");
		artistAndScoreDiv.classList.add("artist-score-div");

		const albumArtist = document.createElement("p");
		albumArtist.classList.add("album-artist");
		albumArtist.innerText = info.artist;

		const trackScore = document.createElement("p");
		trackScore.classList.add("score");
		trackScore.innerText = `${Math.round(info.score)}`;
		trackScore.style.color = colourScore(info.score);

		artistAndScoreDiv.appendChild(albumArtist);
		artistAndScoreDiv.appendChild(trackScore);

		infoDiv.appendChild(albumTitle);
		infoDiv.appendChild(artistAndScoreDiv);
		div.appendChild(infoDiv);

		div.addEventListener("click", () => {
			onTrackSearchAndPlay(info.id);

			player.setQueue(
				album.tracks.slice(0, idx - 1),
				info,
				album.tracks.slice(idx + 1)
			);

			player.resume();
		});

		tracksContainer.appendChild(div);
	}
}
