import { colourScore } from "../lib/score";
import { Track } from "../musica";

export default function AlbumTrack({
	track,
	number
}: {
	track: Track;
	number?: number;
}) {
	return (
		<div className="listTerm">
			<span className="track-number">{number ? number : ""}</span>

			<div className="track-info">
				<p className="album-title">{track.title}</p>
				<div className="artist-score-div">
					<p className="album-artist">{track.artist}</p>

					<p
						className="score"
						style={{
							color: colourScore(track.score)
						}}
					>
						{`${Math.round(track.score)}`}
					</p>
				</div>
			</div>
		</div>
	);
}
