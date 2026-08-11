import { useEffect, useState } from "react";
import { colourScore } from "../lib/score.js";
import { Album, Artist } from "../musica.js";
import LargeAlbum from "../components/LargeAlbum.js";
import { contextMenuHelper } from "../components/contextMenus/ContextMenu.js";
import { hexToRgb } from "../lib/colour.js";

export default function Artist() {
	// context menu, close on any mouse press
	const { contextMenu: _, activateContextMenu } = contextMenuHelper<Album>();

	const id = new URL(window.location.href).pathname.split("/")[2];

	const [artist, setArtist] = useState<Artist | undefined>();
	const [colours, setColours] = useState<[string, string] | undefined>();
	useEffect(() => {
		let isMounted = true;

		const fetchartists = async () => {
			try {
				const artist: Artist = await (
					await fetch(`/api/artist/${id}/info`, { priority: "high" })
				).json();

				artist.albums.sort(
					(a, b) => (a.modified ?? 0) - (b.modified ?? 0)
				);

				if (isMounted) {
					setArtist(artist);

					const response: { dominantColour: string } = await (
						await fetch(
							`/api/track/${artist.albums[0].tracks[0].id}/colour`,
							{
								priority: "high"
							}
						)
					).json();

					const rgbMain = hexToRgb(response.dominantColour);

					const largestMagnitude = Math.max(...rgbMain);
					const divisor = largestMagnitude / 30;

					const rgbDarker = rgbMain.map((value) =>
						Math.round(value / divisor)
					);
					const darker = `rgb(${rgbDarker.join(", ")})`;

					if (isMounted) {
						setColours([response.dominantColour, darker]);
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

	document.title = artist ? `${artist.name} - Musica` : "Artist - Musica";

	return (
		<>
			<div style={styles.hero}>
				<img
					style={styles.art}
					src={
						artist
							? `/api/track/${artist.albums[0].tracks[0].id}/art`
							: undefined
					}
				/>

				<div>
					<p>Artist</p>

					<h1 style={styles.title}>
						{artist?.name ?? "Loading artist..."}
					</h1>

					<p
						style={{
							color: artist ? colourScore(artist.score) : ""
						}}
					>
						{artist ? `Score: ${Math.round(artist.score)}` : ""}
					</p>
				</div>
			</div>

			<div>
				<h3>Albums</h3>
				<div style={styles.albumList}>
					{artist
						? artist.albums.map((album, index) => (
								<LargeAlbum
									key={index}
									album={album}
									onContextMenu={(e) =>
										activateContextMenu(e, album)
									}
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

	albumList: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(160px, 200px))",
		gap: "15px",
		paddingTop: "10px"
	}
};
