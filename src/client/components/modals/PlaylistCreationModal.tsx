import { useRef } from "react";
import { createPlaylist } from "../../lib/playlists";
import { Track } from "../../musica";
import ModalBase from "./ModalBase";

export default function PlaylistCreationModal({ tracks }: { tracks: Track[] }) {
	const input = useRef<HTMLInputElement | null>(null);

	return (
		<ModalBase title="Create a Playlist">
			<input type="text" ref={input}></input>

			<button
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
				onClick={() => {
					window.setModal(undefined);
				}}
			>
				Cancel
			</button>
		</ModalBase>
	);
}
