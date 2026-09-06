//import { useNavigate } from "react-router-dom";
import { Artist } from "../../musica";
import ContextMenu from "./ContextMenu";
import { player } from "../../Player";

export default function ArtistContextMenu({
	x,
	y,

	artist
}: {
	x: number;
	y: number;

	artist: Artist;
}) {
	//const navigation = useNavigate();

	const playArtist = (artist: Artist, shuffle: boolean = false) => {
		if (!artist.albums?.length) return;

		const tracks = artist.albums.map((album) => album.tracks).flat();

		player.setQueue([], tracks[0], tracks.slice(1), shuffle);
		player.resume();
	};
	const onPlay = (shuffle: boolean) => playArtist(artist, shuffle);

	const items = [
		{ label: "Play", action: () => onPlay(false) },
		{ label: "Shuffle", action: () => onPlay(true) }
	];

	return (
		<ContextMenu
			x={x}
			y={y}

			title={artist.name}
			items={items}
		></ContextMenu>
	);
}
