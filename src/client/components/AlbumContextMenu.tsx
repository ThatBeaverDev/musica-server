import { Album } from "../musica";
import ContextMenu from "./ContextMenu";

export default function AlbumContextMenu({
	x,
	y,

	album,
	onPlay
}: {
	x: number;
	y: number;

	album: Album;
	onPlay: (shuffle?: boolean) => void;
}) {
	const items = [
		{ label: "Play", action: () => onPlay(false) },
		{ label: "Shuffle", action: () => onPlay(true) }
	];

	return (
		<ContextMenu
			x={x}
			y={y}

			title={`${album.title} by ${album.artist}`}
			items={items}
		></ContextMenu>
	);
}
