import { useNavigate } from "react-router-dom";
import { Album } from "../../musica";
import ContextMenu from "./ContextMenu";
import { player } from "../../Player";
import PlaylistAdditionModal from "../modals/PlaylistAdditionModal";

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
		{
			label: "Play",
			icon: "/img/play-unfilled.svg",
			action: () => onPlay(false)
		},
		{
			label: "Shuffle",
			icon: "/img/shuffle.svg",
			action: () => onPlay(true)
		},
		{
			label: "Add to Playlist",
			icon: "/img/list-plus.svg",
			action: () => {
				window.setModal(
					<PlaylistAdditionModal tracks={album.tracks} />
				);
			}
		},
		{
			label: "Show Artist",
			icon: "/img/empty.svg",
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
