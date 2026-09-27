import { Album, Artist, Playlist, Track } from "../../musica";
import { player } from "../../Player";
import AlbumContextMenu from "./AlbumContextMenu";
import ArtistContextMenu from "./ArtistContextMenu";
import { contextMenuHelper } from "./ContextMenu";
import PlaylistContextMenu from "./PlaylistContextMenu";
import TrackContextMenu from "./TrackContextMenu";

export type SmartContextMenu =
	| { type: "track"; track: Track; trackList: Track[]; index: number }
	| { type: "album"; album: Album }
	| { type: "artist"; artist: Artist }
	| { type: "playlist"; playlist: Playlist };

export function smartContextMenuHelper() {
	return contextMenuHelper<SmartContextMenu>();
}

export default function SmartContextMenu({
	x,
	y,
	menu
}: {
	x: number;
	y: number;
	menu: SmartContextMenu;
}) {
	switch (menu.type) {
		case "track":
			return (
				<TrackContextMenu
					x={x}
					y={y}
					track={menu.track}
					onPlay={() => {
						if (menu.type != "track") return;

						const { index, track: item } = menu;

						player.setQueue(
							menu.trackList.slice(0, index - 1),
							item,
							menu.trackList.slice(index + 1)
						);
						player.resume();
					}}
				/>
			);
		case "album":
			return <AlbumContextMenu x={x} y={y} album={menu.album} />;
		case "artist":
			return <ArtistContextMenu x={x} y={y} artist={menu.artist} />;
		case "playlist":
			return <PlaylistContextMenu x={x} y={y} playlist={menu.playlist} />;
	}
}
