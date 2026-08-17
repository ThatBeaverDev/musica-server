import { useNavigate } from "react-router-dom";
import { Album } from "../../musica";
import ContextMenu from "./ContextMenu";
import { player } from "../../Player";

export default function AlbumContextMenu({
	x,
	y,

	album
}: {
	x: number;
	y: number;

	album: Album;
}) {
	const navigation = useNavigate();

	const playAlbum = (album: Album, shuffle: boolean = false) => {
		if (!album.tracks?.length) return;

		player.setQueue([], album.tracks[0], album.tracks.slice(1), shuffle);
		player.resume();
	};
	const onPlay = (shuffle: boolean) => playAlbum(album, shuffle);

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
