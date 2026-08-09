import { useEffect, useState } from "react";
import { colourScore } from "../lib/score.js";
import { Album } from "../musica.js";
import AlbumTrack from "../components/AlbumTrack.js";

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

			<div className="hero">
				<img
					id="art"
					className="cover"
					src={
						album
							? `/api/track/${album.tracks[0].id}/art`
							: undefined
					}
				/>

				<div className="hero-info">
					<p className="label">Album</p>
					<h1 id="title">{album?.title ?? "Loading Album..."}</h1>
					<p id="artist-release">
						{album
							? `${album.artist}${album.release ? ` (${new Date(album.release).getFullYear()})` : ""}`
							: ""}
					</p>
					<p
						id="score"
						style={{ color: album ? colourScore(album.score) : "" }}
					>
						{album ? `Score: ${Math.round(album.score)}` : ""}
					</p>
				</div>
			</div>

			<div className="section">
				<h3>Tracks</h3>
				<div className="trackList" id="trackList">
					{album ? (
						album.tracks.map((track, index) => (
							<AlbumTrack
								key={index}
								track={track}
								number={index + 1}
							/>
						))
					) : (
						<p>Huh, Nothing's Here?</p>
					)}
				</div>
			</div>
		</>
	);
}
