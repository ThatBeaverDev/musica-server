import { Album } from "../index/indexer";
import { player } from "./player.js";

export default async function album(div: HTMLDivElement) {
	div.innerHTML = `
        <div class="hero">
            <img id="art" class="cover" />

            <div class="hero-info">
                <p class="label">Album</p>
                <h1 id="title">Loading Album...</h1>
                <p id="artist-release"></p>
            </div>
        </div>

        <div class="section">
            <h3>Tracks</h3>
            <div class="trackList" id="trackList"></div>
        </div>`;

	const id = new URL(window.location.href).pathname.split("/")[2];
	const album: Album = await (await fetch(`/api/album/${id}/info`)).json();

	const title = document.getElementById("title")!;
	title.innerText = album.title;

	const artistAndRelease = document.getElementById("artist-release")!;
	artistAndRelease.innerText = album.artist;
	if (album.release)
		artistAndRelease.innerText += ` (${new Date(album.release).getFullYear()})`;

	const art = document.getElementById("art")! as HTMLImageElement;
	art.src = `/api/track/${album.tracks[0].id}/art`;

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

		const albumArtist = document.createElement("p");
		albumArtist.classList.add("album-artist");
		albumArtist.innerText = info.artist;

		infoDiv.appendChild(albumTitle);
		infoDiv.appendChild(albumArtist);
		div.appendChild(infoDiv);

		div.addEventListener("click", () => {
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
