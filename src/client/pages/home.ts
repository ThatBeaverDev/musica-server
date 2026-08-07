import { Album } from "../musica";
import { player } from "../player";
import albumPage from "./album";

export default async function home(
	div: HTMLDivElement,
	aborteeFunction: {
		abort: () => void;
	}
) {
	aborteeFunction.abort();

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
		headers: { albums: JSON.stringify(albumIDs) },
		priority: "high"
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

	const images: HTMLImageElement[] = [];

	for (const album of albums) {
		const tileDiv = document.createElement("div");
		tileDiv.classList.add("card");
		tileDiv.addEventListener("contextmenu", (e) => {
			e.preventDefault();

			const container = document.createElement("div");
			container.classList.add("album-context-menu");
			container.style.left = `${e.clientX}px`;
			container.style.top = `${e.clientY}px`;

			document.body.appendChild(container);

			const play = (shuffle: boolean) => {
				player.setQueue(
					[],
					album.tracks[0],
					album.tracks.slice(1),
					shuffle
				);
				player.resume();
			};

			const items: [string, () => Promise<void> | void][] = [
				["Play", () => play(false)],
				["Shuffle", () => [play(true)]]
			];

			const holder = document.createElement("p");
			holder.classList.add("album-context-menu-title");
			holder.innerText = `${album.artist} - ${album.title}`;
			container.appendChild(holder);

			for (const item of items) {
				const holder = document.createElement("p");
				holder.classList.add("album-context-menu-item");
				holder.innerText = item[0];

				holder.addEventListener("pointerdown", () => item[1]());

				container.appendChild(holder);
			}

			window.addEventListener("pointerdown", () => container.remove(), {
				once: true
			});
		});

		const albumImage = document.createElement("img");
		albumImage.classList.add("albumArt");
		albumImage.src = `/api/track/${album.tracks?.[0].id}/art`;
		albumImage.loading = "lazy";
		albumImage.fetchPriority = "low";
		images.push(albumImage);
		tileDiv.appendChild(albumImage);

		const albumTitle = document.createElement("p");
		albumTitle.classList.add("album-title");
		albumTitle.innerText = album.title;
		tileDiv.appendChild(albumTitle);

		const albumArtist = document.createElement("p");
		albumArtist.classList.add("album-artist");
		albumArtist.innerText = album.artist;
		tileDiv.appendChild(albumArtist);

		tileDiv.addEventListener("click", () => {
			history.pushState({}, "", `/album/${album.id}`);

			albumPage(div, aborteeFunction);
		});

		albumContainer.appendChild(tileDiv);
	}

	aborteeFunction.abort = () => {
		for (const image of images) {
			image.src = "";
			image.remove();
		}
	};
}
