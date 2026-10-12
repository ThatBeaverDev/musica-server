import { useEffect, useState } from "react";
import { colourScore } from "../lib/score.js";
import { Artist } from "../musica.js";
import LargeAlbum from "../components/LargeAlbum.js";
import SmartContextMenu, {
	smartContextMenuHelper
} from "../components/contextMenus/SmartContextMenu.js";
import { getItemColours } from "../lib/colour.js";
import { getArtistMetadata } from "../lib/metadata/artists.js";
import styles from "./artist.module.css";
import BigPlayButton from "../components/BigPlayButton.js";
import { player } from "../Player.js";
import { formatTrackListDuration } from "../lib/time.js";
import { EllipsisVertical } from "lucide-react";

export default function Artist() {
	const id = new URL(window.location.href).pathname.split("/")[2];

	const [artist, setArtist] = useState<Artist | undefined>();
	const [colours, setColours] = useState<[string, string] | undefined>();
	useEffect(() => {
		let isMounted = true;

		const fetchartists = async () => {
			try {
				const artist = await getArtistMetadata(id);

				if (isMounted) {
					setArtist(artist);

					const [colour, darker] = await getItemColours("artist", id);

					if (isMounted) {
						setColours([colour, darker]);
					}
				}
			} catch (error) {
				console.error("Error loading artists:", error);
			}
		};

		fetchartists();

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

	const bio = artist?.biography
		?.replaceAll?.("<br>", "\n")
		?.replaceAll?.("<br/>", "\n")
		?.replaceAll?.("<br />", "\n")
		?.replaceAll("</br>", "")
		?.replaceAll("</ br>", "");

	const tracks = artist ? artist.albums.flatMap((album) => album.tracks) : [];
	const trackCountInfo = artist
		? `${tracks.length} track${tracks.length == 1 ? "" : "s"}`
		: "";

	const artistDurationInfo = artist ? formatTrackListDuration(tracks) : "";

	const icon = artist ? `/api/artist/${artist.id}/art` : undefined;
	document.title = artist ? `${artist.name} - Musica` : "Artist - Musica";

	return (
		<>
			<div className={styles.hero}>
				<img className={styles.art} src={icon} />

				<div className={styles.info}>
					<p className={styles.text}>Artist</p>

					<h1 className={styles.title}>
						{artist?.name ?? "Loading Artist..."}
					</h1>

					<p
						className={styles.text}

						style={{
							color: artist ? colourScore(artist.score) : ""
						}}
					>
						{artist ? `Score: ${Math.round(artist.score)}` : ""}
					</p>

					<div className={styles.utilityBar}>
						<BigPlayButton
							className={styles.bigPlayButton}

							onClick={() => {
								player.setQueue([], tracks[0], tracks.slice(1));
								player.resume();
							}}
						></BigPlayButton>

						<div className={styles.rightUtilityBar}>
							<EllipsisVertical
								className={styles.contextButton}

								onClick={(e) => {
									if (!artist) return;
									activateContextMenu(e, {
										type: "artist",
										artist
									});
								}}
							/>
						</div>
					</div>
				</div>
			</div>

			<div>
				<h3>Albums</h3>
				<div className={styles.albumList}>
					{artist
						? artist.albums.map((album, index) => (
								<LargeAlbum
									key={index}
									album={album}
									onContextMenu={(e) =>
										activateContextMenu(e, {
											type: "album",
											album
										})
									}
								/>
							))
						: undefined}
				</div>

				{bio ? (
					<>
						<h3>Artist Biography</h3>
						<p>{bio}</p>
					</>
				) : undefined}

				<br />
				<p
					className={styles.artistMetadata}
				>{`${trackCountInfo} - ${artistDurationInfo}`}</p>
			</div>
		</>
	);
}
