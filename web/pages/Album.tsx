import { useEffect, useState } from "react";
import { colourScore } from "../lib/score.js";
import { Album } from "../musica.js";
import AlbumTrack from "../components/AlbumTrack.js";
import { onTrackSearchAndPlay, player } from "../Player.js";
import SmartContextMenu, {
	smartContextMenuHelper
} from "../components/contextMenus/SmartContextMenu.js";
import { useNavigate } from "react-router-dom";
import { getItemColours } from "../lib/colour.js";
import BigPlayButton from "../components/BigPlayButton.js";
import { getAlbumMetadata } from "../lib/metadata/albums.js";
import styles from "./album.module.css";
import { formatTrackListDuration } from "../lib/time.js";
import { EllipsisVertical } from "lucide-react";

export default function Album() {
	const navigate = useNavigate();

	const id = new URL(window.location.href).pathname.split("/")[2];

	function playByIndex(index: number) {
		if (!album) return;

		player.setQueue(
			album.tracks.slice(0, index - 1),
			album.tracks[index],
			album.tracks.slice(index + 1)
		);

		player.resume();
	}

	const [album, setAlbum] = useState<Album | undefined>();
	const [colours, setColours] = useState<[string, string] | undefined>();
	useEffect(() => {
		let isMounted = true;

		const fetchAlbum = async () => {
			try {
				const album = await getAlbumMetadata(id);

				if (isMounted) {
					setAlbum(album);

					const [colour, darker] = await getItemColours("album", id);

					if (isMounted) {
						setColours([colour, darker]);
					}
				}
			} catch (error) {
				console.error("Error loading albums:", error);
			}
		};

		fetchAlbum();

		return () => {
			isMounted = false;
		};
	}, []);

	const [artistLinkHover, setArtistLinkHover] = useState(false);

	useEffect(() => {
		if (colours) {
			window.setBackground(
				`linear-gradient(to bottom, ${colours[0]}, ${colours[1]} 330px`
			);
		}

		return () => window.setBackground("transparent");
	});

	const trackCountInfo = album
		? `${album.tracks.length} track${album.tracks.length == 1 ? "" : "s"}`
		: "";

	const albumDurationInfo = album
		? formatTrackListDuration(album.tracks)
		: "";

	const icon = album ? `/api/album/${album.id}/art` : undefined;
	document.title = album
		? `${album.title} by ${album.artist} - Musica`
		: "Album - Musica";

	return (
		<>
			<div className={styles.hero}>
				<img className={styles.art} src={icon} />

				<div className={styles.info}>
					<p className={styles.text}>Album</p>

					<h1 className={styles.title}>
						{album?.title ?? "Loading Album..."}
					</h1>

					<p className={styles.text}>
						{album ? (
							<>
								<span
									onMouseEnter={() =>
										setArtistLinkHover(true)
									}
									onMouseLeave={() =>
										setArtistLinkHover(false)
									}

									onClick={() =>
										navigate(`/artist/${album.artistId}`)
									}

									style={{
										textDecoration: artistLinkHover
											? "underline"
											: "",
										cursor: "pointer"
									}}
								>
									{album.artist}
								</span>
								<span>
									{album.release
										? ` (${new Date(album.release).getFullYear()})`
										: ""}
								</span>
							</>
						) : undefined}
					</p>
					<p
						className={styles.text}

						style={{
							color: album ? colourScore(album.score) : ""
						}}
					>
						{album ? `Score: ${Math.round(album.score)}` : ""}
					</p>

					<div className={styles.utilityBar}>
						<BigPlayButton
							className={styles.bigPlayButton}

							onClick={() => {
								if (!album) return;
								player.setQueue(
									[],
									album.tracks[0],
									album.tracks.slice(1)
								);
								player.resume();
							}}
						></BigPlayButton>

						<div className={styles.rightUtilityBar}>
							<EllipsisVertical
								className={styles.contextButton}

								onClick={(e) => {
									if (!album) return;
									activateContextMenu(e, {
										type: "album",
										album
									});
								}}
							/>
						</div>
					</div>
				</div>
			</div>

			<div>
				<h3>Tracks</h3>
				<div className={styles.trackList}>
					{album
						? album.tracks.map((track, index) => (
								<AlbumTrack
									key={index}
									track={track}
									onClick={() => {
										onTrackSearchAndPlay(track.id);

										playByIndex(index);
									}}
									onContextMenu={(e) => {
										if (!track || !album) return;
										activateContextMenu(e, {
											type: "track",
											track,
											trackList: album.tracks,
											index
										});
									}}
								/>
							))
						: undefined}
				</div>

				<br />
				<p
					className={styles.albumMetadata}
				>{`${trackCountInfo} - ${albumDurationInfo}`}</p>
			</div>
		</>
	);
}
