import { Playlist } from "../../musica";
import ContextMenu from "./ContextMenu";
import { player } from "../../Player";

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
		{ label: "Play", icon: "/img/play.svg", action: () => onPlay(false) },
		{
			label: "Shuffle",
			icon: "/img/shuffle.svg",
			action: () => onPlay(true)
		},
		{
			label: "Delete Playlist",
			icon: "/img/dislike.svg",
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
