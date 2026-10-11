import { useRef } from "react";
import { createPlaylist } from "../../lib/playlists";
import { Track } from "../../musica";
import ModalBase from "./ModalBase";
import styles from "./PlaylistCreationModal.module.css";

export default function PlaylistCreationModal({ tracks }: { tracks: Track[] }) {
	const input = useRef<HTMLInputElement | null>(null);

	const isSingle = tracks.length == 1;

	return (
		<ModalBase
			title="Create a Playlist"
			description={`This playlist will contain your track${isSingle ? "" : "s"}.`}
		>
			<input type="text" ref={input} className={styles.text}></input>

			<button
				className={`${styles.button} ${styles.primaryButton}`}
				onClick={() => {
					if (input.current) {
						createPlaylist(input.current.value, "", tracks);
					}

					window.setModal(undefined);
				}}
			>
				Create Playlist
			</button>
			<button
				className={styles.button}
				onClick={() => {
					window.setModal(undefined);
				}}
			>
				Cancel
			</button>
		</ModalBase>
	);
}
