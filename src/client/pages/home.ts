import { Album } from "../musica";
import album from "./album";

export default async function home(div: HTMLDivElement) {
	div.innerHTML = `
    <h1>Welcome</h1>

    <div class="section">
        <h3>Albums</h3>
        <div class="grid" id="albumsGrid"></div>
    </div>`;

	document.title = "Home - Musica";

	const idURL = `/api/albums/list`;
	const albumIdsRequest = await fetch(idURL);

	if (!albumIdsRequest.ok) {
		throw new Error(
			`Failed to list albums from ${idURL}: HTTP Status ${albumIdsRequest.status}: ${albumIdsRequest.statusText}`
		);
	}
	const albumIDs = await albumIdsRequest.json();

	const albumStatsRequest = await fetch(`/api/bulk/albums/info`, {
		headers: { albums: JSON.stringify(albumIDs) }
	});

	if (!albumStatsRequest.ok) {
		throw new Error(
			`Failed to list albums from ${idURL}: HTTP Status ${albumStatsRequest.status}: ${albumStatsRequest.statusText}`
		);
	}
	const albums: Album[] = await albumStatsRequest.json();

	albums.sort((a, b) => {
		return b.modified - a.modified;
	});

	const albumContainer = document.getElementById("albumsGrid");
	if (!albumContainer) return;

	for (const info of albums) {
		const tileDiv = document.createElement("div");
		tileDiv.classList.add("card");

		const albumImage = document.createElement("img");
		albumImage.classList.add("albumArt");
		albumImage.src = `/api/track/${info.tracks?.[0].id}/art`;
		albumImage.loading = "lazy";
		tileDiv.appendChild(albumImage);

		const albumTitle = document.createElement("p");
		albumTitle.classList.add("album-title");
		albumTitle.innerText = info.title;
		tileDiv.appendChild(albumTitle);

		const albumArtist = document.createElement("p");
		albumArtist.classList.add("album-artist");
		albumArtist.innerText = info.artist;
		tileDiv.appendChild(albumArtist);

		tileDiv.addEventListener("click", () => {
			history.pushState({}, "", `/album/${info.id}`);

			album(div);
		});

		albumContainer.appendChild(tileDiv);
	}
}
