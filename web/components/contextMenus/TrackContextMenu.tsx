import { useNavigate } from "react-router-dom";
import { Track } from "../../musica";
import ContextMenu from "./ContextMenu";
import { onTrackSearchAndPlay, player } from "../../Player";
import PlaylistAdditionModal from "../modals/PlaylistAdditionModal";

export default function TrackContextMenu({
	x,
	y,

	track,
	onPlay
}: {
	x: number;
	y: number;

	track: Track;
	onPlay: (shuffle?: boolean) => void;
}) {
	const navigation = useNavigate();

	function dynamicQueueFromHere() {
		onTrackSearchAndPlay(track.id);

		player.startDynamicQueue(track);
	}

	const items = [
		{
			label: "Play",
			icon: "/img/play-unfilled.svg",
			action: () => {
				onTrackSearchAndPlay(track.id);
				onPlay(false);
			}
		},
		{
			label: "Edit Metadata",
			icon: "/img/empty.svg",
			action: () => navigation(`/edit/track/${track.id}`)
		},
		{
			label: "Add to Playlist",
			icon: "/img/list-plus.svg",
			action: () => {
				window.setModal(<PlaylistAdditionModal tracks={[track]} />);
			}
		},
		{
			label: "Add to Queue",
			icon: "/img/empty.svg",
			action: () => onPlay(false)
		},
		{
			label: "Start Dynamic Queue Here",
			icon: "/img/dynamic-queue.svg",
			action: () => dynamicQueueFromHere()
		},
		{
			label: "Show Album",
			icon: "/img/empty.svg",
			action: () => {
				navigation(`/album/${track.albumId}`);
			}
		},
		{
			label: "Show Artist",
			icon: "/img/empty.svg",
			action: () => {
				navigation(`/artist/${track.albumArtistId}`);
			}
		}
	];

	return (
		<ContextMenu
			x={x}
			y={y}

			title={`${track.title} by ${track.artist}`}
			items={items}
		></ContextMenu>
	);
}
