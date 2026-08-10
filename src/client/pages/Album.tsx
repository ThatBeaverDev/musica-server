import { useEffect, useState } from "react";
import { colourScore } from "../lib/score.js";
import { Album } from "../musica.js";
import AlbumTrack from "../components/AlbumTrack.js";
import { onTrackSearchAndPlay, player } from "../Player.js";

export default function Album() {
	const id = new URL(window.location.href).pathname.split("/")[2];

	const [album, setAlbum] = useState<Album | undefined>();
	useEffect(() => {
		let isMounted = true;

		const fetchAlbums = async () => {
			try {
				const album: Album = await (
					await fetch(`/api/album/${id}/info`, { priority: "high" })
				).json();

				album.tracks.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

				if (isMounted) {
					setAlbum(album);
				}
			} catch (error) {
				console.error("Error loading albums:", error);
			}
		};

		fetchAlbums();

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<>
			<title>
				{album
					? `${album.title} by ${album.artist} - Musica`
					: "Album - Musica"}
			</title>

			<div style={styles.hero}>
				<img
					style={styles.art}
					src={
						album
							? `/api/track/${album.tracks[0].id}/art`
							: undefined
					}
				/>

				<div>
					<p>Album</p>

					<h1 style={styles.title}>
						{album?.title ?? "Loading Album..."}
					</h1>

					<p>
						{album
							? `${album.artist}${album.release ? ` (${new Date(album.release).getFullYear()})` : ""}`
							: ""}
					</p>
					<p style={{ color: album ? colourScore(album.score) : "" }}>
						{album ? `Score: ${Math.round(album.score)}` : ""}
					</p>
				</div>
			</div>

			<div>
				<h3>Tracks</h3>
				<div style={styles.trackList}>
					{album
						? album.tracks.map((track, index) => (
								<AlbumTrack
									key={index}
									track={track}
									number={index + 1}
									onClick={() => {
										onTrackSearchAndPlay(track.id);

										player.setQueue(
											album.tracks.slice(0, index - 1),
											album.tracks[index],
											album.tracks.slice(index + 1)
										);

										player.resume();
									}}
								/>
							))
						: undefined}
				</div>
			</div>
		</>
	);
}

const styles = {
	hero: {
		display: "flex",
		alignItems: "flex-end",
		gap: "32px",
		marginBottom: "40px"
	},

	art: {
		width: "240px",
		height: "240px",
		objectFit: "cover" as "cover",
		borderRadius: "6%",
		boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
		flexShrink: 0
	},

	title: {
		margin: 0,
		fontSize: "3rem",
		fontWeight: 700,
		textAlign: "left" as "left",
		whiteSpace: "normal" as "normal"
	},

	trackList: {
		display: "flex",
		flexDirection: "column" as "column",
		gap: "4px"
	}
};
