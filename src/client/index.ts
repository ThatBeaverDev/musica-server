import album from "./pages/album";
import home from "./pages/home";

const url = new URL(window.location.href);
const contentDiv = document.querySelector("div.content") as HTMLDivElement;
if (!contentDiv) throw new Error("Content div not returned");

// make sidebar dynamic
const homeButton = document.querySelector(
	"body > div.sidebar > div > div:nth-child(1)"
);

if (homeButton)
	homeButton.addEventListener("click", () => {
		home(contentDiv);
		history.pushState({}, "", "/");
	});

if (url.pathname.startsWith("/album/")) {
	album(contentDiv);
} else if (url.pathname.startsWith("/artist/")) {
	throw new Error("Artist not handled");
} else {
	home(contentDiv);
}
