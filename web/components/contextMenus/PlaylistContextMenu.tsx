import { Playlist } from "../../musica";
import ContextMenu from "./ContextMenu";
import { player } from "../../Player";
import { Play, Shuffle, Trash } from "lucide-react";

export default function PlaylistContextMenu({
	x,
	y,

	playlist
}: {
	x: number;
	y: number;

	playlist: Playlist;
}) {
	const playPlaylist = (playlist: Playlist, shuffle: boolean = false) => {
		if (!playlist.tracks?.length) return;

		player.setQueue(
			[],
			playlist.tracks[0],
			playlist.tracks.slice(1),
			shuffle
		);
		player.resume();
	};
	const onPlay = (shuffle: boolean) => playPlaylist(playlist, shuffle);

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
			label: "Delete Playlist",
			colour: "#ff0000",
			icon: <Trash width={14} height={14} color="#ff0000" />,
			action: () => {
				fetch(`/api/playlist/${playlist.id}/delete`);
			}
		}
	];

	return (
		<ContextMenu
			x={x}
			y={y}

			title={`${playlist.name}`}
			items={items}
		></ContextMenu>
	);
}
