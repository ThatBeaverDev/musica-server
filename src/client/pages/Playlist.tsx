import { useEffect, useState } from "react";
import { Playlist, Track } from "../musica.js";
import AlbumTrack from "../components/AlbumTrack.js";
import { onTrackSearchAndPlay, player } from "../Player.js";
import { contextMenuHelper } from "../components/contextMenus/ContextMenu.js";
import TrackContextMenu from "../components/contextMenus/TrackContextMenu.js";
import { getItemColours } from "../lib/colour.js";
import BigPlayButton from "../components/BigPlayButton.js";
import { getPlaylistMetadata } from "../lib/metadata.js";
import styles from "./album.module.css";
import { formatTrackListDuration } from "../lib/time.js";

export default function Playlist() {
	const { contextMenu, activateContextMenu } = contextMenuHelper<Track>();
	//const navigate = useNavigate();

	const id = new URL(window.location.href).pathname.split("/")[2];

	function playByIndex(index: number) {
		if (!playlist) return;

		player.setQueue(
			playlist.tracks.slice(0, index - 1),
			playlist.tracks[index],
			playlist.tracks.slice(index + 1)
		);

		player.resume();
	}
	const playTrack = (track: Track) => {
		if (!playlist) return;

		const index = playlist.tracks
			.map((track) => track.id)
			.indexOf(track.id);

		playByIndex(index);
	};

	const [playlist, setPlaylist] = useState<Playlist | undefined>();
	const [colours, setColours] = useState<[string, string] | undefined>();
	useEffect(() => {
		let isMounted = true;

		const fetchPlaylist = async () => {
			try {
				const playlist = await getPlaylistMetadata(id);

				if (isMounted) {
					setPlaylist(playlist);

					const [colour, darker] = await getItemColours(
						"playlist",
						id
					);

					if (isMounted) {
						setColours([colour, darker]);
					}
				}
			} catch (error) {
				console.error("Error loading playlists:", error);
			}
		};

		fetchPlaylist();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (colours) {
			window.setBackground(
				`linear-gradient(to bottom, ${colours[0]}, ${colours[1]} 330px`
			);
		}

		return () => window.setBackground("transparent");
	});

	const trackCountInfo = playlist
		? `${playlist.tracks.length} track${playlist.tracks.length == 1 ? "" : "s"}`
		: "";

	const playlistDurationInfo = playlist
		? formatTrackListDuration(playlist.tracks)
		: "";

	const icon = playlist ? `/api/playlist/${playlist.id}/art` : undefined;
	document.title = playlist
		? `${playlist.name} - Musica`
		: "Playlist - Musica";

	return (
		<>
			<div className={styles.hero}>
				<img className={styles.art} src={icon} />

				<div>
					<p className={styles.text}>Playlist</p>

					<h1 className={styles.title}>
						{playlist?.name ?? "Loading Playlist..."}
					</h1>

					<p className={styles.text}>
						{playlist ? (
							<span>{playlist.description}</span>
						) : undefined}
					</p>

					<BigPlayButton
						className={styles.bigPlayButton}

						onClick={() => {
							if (!playlist) return;

							player.setQueue(
								[],
								playlist.tracks[0],
								playlist.tracks.slice(1)
							);
							player.resume();
						}}
					></BigPlayButton>
				</div>
			</div>

			<div>
				<h3>Tracks</h3>
				<div className={styles.trackList}>
					{playlist
						? playlist.tracks.map((track, index) => (
								<AlbumTrack
									key={index}
									track={track}
									art={true}
									onClick={() => {
										onTrackSearchAndPlay(track.id);

										playByIndex(index);
									}}
									onContextMenu={(e) => {
										activateContextMenu(e, track);
									}}
								/>
							))
						: undefined}
				</div>

				<br />
				<p
					className={styles.albumMetadata}
				>{`${trackCountInfo} - ${playlistDurationInfo}`}</p>
			</div>

			{contextMenu && (
				<TrackContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					track={contextMenu.data}
					onPlay={() => playTrack(contextMenu.data)}
				/>
			)}
		</>
	);
}
