import { useNavigate } from "react-router-dom";
import { Album } from "../../musica";
import ContextMenu from "./ContextMenu";
import { player } from "../../Player";
import PlaylistAdditionModal from "../modals/PlaylistAdditionModal";
import { ListPlus, Play, Shuffle, User } from "lucide-react";

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
			icon: <Play width={14} height={14} />,
			action: () => onPlay(false)
		},
		{
			label: "Shuffle",
			icon: <Shuffle width={14} height={14} />,
			action: () => onPlay(true)
		},
		{
			label: "Add to Playlist",
			icon: <ListPlus width={14} height={14} />,
			action: () => {
				window.setModal(
					<PlaylistAdditionModal tracks={album.tracks} />
				);
			}
		},
		{
			label: "Show Artist",
			icon: <User width={14} height={14} />,
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
