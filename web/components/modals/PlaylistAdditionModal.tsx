import { useEffect, useState } from "preact/hooks";
import { Playlist, Track } from "../../musica";
import {
	getPlaylistIds,
	getPlaylistMetadataBulk
} from "../../lib/metadata/playlists";
import ModalBase from "./ModalBase";
import PlaylistCreationModal from "./PlaylistCreationModal";
import { addItemsToPlaylist } from "../../lib/playlists";
import { formatTrackListDuration } from "../../lib/time";
import styles from "./PlaylistAdditionModal.module.css";
import { ListPlus } from "lucide-react";

export default function PlaylistAdditionModal({ tracks }: { tracks: Track[] }) {
	function PlaylistEntry({ playlist }: { playlist: Playlist }) {
		return (
			<div
				className={styles.outerEntry}
				onClick={() => {
					window.setModal(undefined);
					addItemsToPlaylist(playlist.id, tracks);
				}}
			>
				<img
					src={`/api/playlist/${playlist.id}/art`}
					className={styles.art}
				/>

				<div className={styles.stack}>
					<b>
						<p>{playlist.name}</p>
					</b>
					<p>{formatTrackListDuration(playlist.tracks)}</p>
				</div>
			</div>
		);
	}

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

	const isOne = tracks.length == 1;

	return (
		<ModalBase
			title="Select a Playlist"
			description={`Select a playlist to add ${isOne ? "this" : "these"} track${isOne ? "" : "s"} to.`}
		>
			<hr className={styles.horizontalRule} />

			<div
				className={styles.outerEntry}
				onClick={() => {
					window.setModal(<PlaylistCreationModal tracks={tracks} />);
				}}
			>
				<ListPlus
					color="#ffffff"
					style={{ transform: "scale(0.75)" }}
					className={styles.art}
				/>

				<div className={styles.stack}>
					<b>
						<p>Create new Playlist</p>
					</b>
				</div>
			</div>

			{playlistList ? (
				playlistList.map((item) => <PlaylistEntry playlist={item} />)
			) : (
				<p>Loading...</p>
			)}
		</ModalBase>
	);
}
