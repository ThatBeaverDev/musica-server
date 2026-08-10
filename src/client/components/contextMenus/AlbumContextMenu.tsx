import { useNavigate } from "react-router-dom";
import { Album } from "../../musica";
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
	const navigation = useNavigate();

	const items = [
		{ label: "Play", action: () => onPlay(false) },
		{ label: "Shuffle", action: () => onPlay(true) },
		{
			label: "Show Artist",
			action: () => {
				navigation(`/artist/${album.artistId}`);
			}
		}
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
