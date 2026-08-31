import { useNavigate } from "react-router-dom";
import { Track } from "../../musica";
import ContextMenu from "./ContextMenu";
import { onTrackSearchAndPlay } from "../../Player";

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

	const items = [
		{
			label: "Play",
			action: () => {
				onTrackSearchAndPlay(track.id);
				onPlay(false);
			}
		},
		{
			label: "Edit Metadata",
			action: () => navigation(`/edit/track/${track.id}`)
		},
		{ label: "Add to Queue", action: () => onPlay(false) },
		{
			label: "Show Album",
			action: () => {
				navigation(`/album/${track.albumId}`);
			}
		},
		{
			label: "Show Artist",
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
