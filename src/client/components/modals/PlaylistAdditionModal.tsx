import { useEffect, useState } from "preact/hooks";
import { Playlist, Track } from "../../musica";
import {
	getPlaylistIds,
	getPlaylistMetadataBulk
} from "../../lib/metadata/playlists";
import ModalBase from "./ModalBase";
import PlaylistCreationModal from "./PlaylistCreationModal";
import { addItemsToPlaylist } from "../../lib/playlists";

export default function PlaylistAdditionModal({ tracks }: { tracks: Track[] }) {
	const [playlistList, setPlaylistList] = useState<Playlist[] | undefined>();
	useEffect(() => {
		let isMounted = true;

		const fetchList = async () => {
			try {
				const ids = await getPlaylistIds();
				const playlists = await getPlaylistMetadataBulk(ids);

				if (isMounted) {
					setPlaylistList(playlists);
				}
			} catch (error) {
				console.error("Error loading albums:", error);
			}
		};

		fetchList();

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<ModalBase title="Select a Playlist">
			<div
				onClick={() => {
					window.setModal(<PlaylistCreationModal tracks={tracks} />);
				}}
			>
				Create new Playlist
			</div>

			{playlistList ? (
				playlistList.map((item) => (
					<div
						onClick={() => {
							window.setModal(undefined);
							addItemsToPlaylist(item.id, tracks);
						}}
					>
						{item.name}
					</div>
				))
			) : (
				<p>Loading...</p>
			)}
		</ModalBase>
	);
}
