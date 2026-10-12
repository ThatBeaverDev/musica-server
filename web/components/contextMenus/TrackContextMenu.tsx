import { useNavigate } from "react-router-dom";
import { Track } from "../../musica";
import ContextMenu from "./ContextMenu";
import { onTrackSearchAndPlay, player } from "../../Player";
import PlaylistAdditionModal from "../modals/PlaylistAdditionModal";
import {
	DiscAlbum,
	ListPlus,
	Pen,
	Play,
	Plus,
	Route,
	User
} from "lucide-react";

export default function TrackContextMenu({
	x,
	y,

	track,
	allowPlay = true,
	onPlay
}: {
	x: number;
	y: number;

	track: Track;
	allowPlay?: boolean;
	onPlay: (shuffle?: boolean) => void;
}) {
	const navigation = useNavigate();

	function dynamicQueueFromHere() {
		onTrackSearchAndPlay(track.id);

		player.startDynamicQueue(track);
	}

	const items = [
		allowPlay
			? {
					label: "Play",
					icon: <Play width={14} height={14} />,
					action: () => {
						onTrackSearchAndPlay(track.id);
						onPlay(false);
					}
				}
			: undefined,
		allowPlay
			? {
					label: "Edit Metadata",
					icon: <Pen width={14} height={14} />,
					action: () => navigation(`/edit/track/${track.id}`)
				}
			: undefined,
		{
			label: "Add to Playlist",
			icon: <ListPlus width={14} height={14} />,
			action: () => {
				window.setModal(<PlaylistAdditionModal tracks={[track]} />);
			}
		},
		{
			label: "Add to Queue",
			icon: <Plus width={14} height={14} />,
			action: () => onPlay(false)
		},
		{
			label: "Start Dynamic Queue Here",
			icon: <Route width={14} height={14} />,
			action: () => dynamicQueueFromHere()
		},
		{
			label: "Show Album",
			icon: <DiscAlbum width={14} height={14} />,
			action: () => {
				navigation(`/album/${track.albumId}`);
			}
		},
		{
			label: "Show Artist",
			icon: <User width={14} height={14} />,
			action: () => {
				navigation(`/artist/${track.albumArtistId}`);
			}
		}
	].filter((item) => item !== undefined);

	return (
		<ContextMenu
			x={x}
			y={y}

			title={`${track.title} by ${track.artist}`}
			items={items}
		></ContextMenu>
	);
}
