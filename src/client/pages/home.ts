import { Album } from "../../index/indexer";
import album from "./album";

export default async function home(div: HTMLDivElement) {
	div.innerHTML = `
    <h1>Welcome</h1>

    <div class="section">
        <h3>Albums</h3>
        <div class="grid" id="albumsGrid"></div>
    </div>`;

	document.title = "Home - Musica";

	const albums: string[] = await (await fetch("/api/albums/list")).json();

	const stats: Album[] = await Promise.all(
		albums.filter(Boolean).map(async (item) => {
			return await (await fetch(`/api/album/${item}/info`)).json();
		})
	);

	const albumContainer = document.getElementById("albumsGrid");
	if (!albumContainer) return;

	for (const info of stats) {
		const tileDiv = document.createElement("div");
		tileDiv.classList.add("card");

		const albumImage = document.createElement("img");
		albumImage.classList.add("albumArt");
		albumImage.src = `/api/track/${info.tracks?.[0].id}/art`;
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
