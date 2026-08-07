import album from "./pages/album";
import home from "./pages/home";
import { player } from "./player";

const url = new URL(window.location.href);
const contentDiv = document.querySelector("div.content") as HTMLDivElement;
if (!contentDiv) throw new Error("Content div not returned");
let aborteeFunction = { abort: () => {} };

// make sidebar dynamic
const homeButton = document.querySelector(
	"body > div.sidebar > div > div:nth-child(1)"
);

if (homeButton)
	homeButton.addEventListener("click", () => {
		home(contentDiv, aborteeFunction);
		history.pushState({}, "", "/");
	});

const dynamicQueueButton = document.querySelector(
	"body > div.sidebar > div > div:nth-child(4)"
);
if (dynamicQueueButton)
	dynamicQueueButton.addEventListener("click", () => {
		player.startDynamicQueue();
		player.resume();
	});

if (url.pathname.startsWith("/album/")) {
	album(contentDiv, aborteeFunction);
} else if (url.pathname.startsWith("/artist/")) {
	throw new Error("Artist not handled");
} else {
	home(contentDiv, aborteeFunction);
}
