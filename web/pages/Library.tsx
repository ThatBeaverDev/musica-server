import { useEffect, useState } from "react";
import Dropdown from "../components/Dropdown";
import styles from "./library.module.css";
import {
	ArrowDown,
	ArrowUp,
	AudioLines,
	DiscAlbum,
	Letters,
	ListVideo,
	Play,
	Star,
	Timer,
	User
} from "lucide-react";
import { getTrackIds, getTrackMetadataBulk } from "../lib/metadata/tracks";
import AlbumTrack from "../components/AlbumTrack";
import { getAlbumIds, getAlbumMetadataBulk } from "../lib/metadata/albums";
import LargeAlbum from "../components/LargeAlbum";
import { getArtistIds, getArtistMetadataBulk } from "../lib/metadata/artists";
import LargeArtist from "../components/LargeArtist";
import { Album, Artist, Playlist, Track } from "../musica";
import { duration, score } from "../lib/properties";
import {
	getPlaylistIds,
	getPlaylistMetadataBulk
} from "../lib/metadata/playlists";
import LargePlaylist from "../components/LargePlaylist";

export default function Library() {
	type FilterType = "tracks" | "albums" | "artists" | "playlists";
	type SortingType =
		"duration" | "plays" | "score" | "title" | "album" | "artist";
	type SortingOrder = "highToLow" | "lowToHigh";

	const [filterType, setFilterType] = useState<FilterType>("tracks");
	const [sortingType, setSortingType] = useState<SortingType>("duration");
	const [sortingOrder, setSortingOrder] = useState<SortingOrder>("highToLow");
	const [view, setView] = useState<React.JSX.Element | null>(null);

	useEffect(() => {
		setView(null);
		function sortByUserChoice<T extends Track | Album | Artist | Playlist>(
			arr: T[]
		): T[] {
			function sortType(item: T) {
				if (sortingType in item) {
					// @ts-expect-error
					return item[sortingType];
				}

				return "";
			}

			switch (sortingType) {
				case "duration":
					arr.sort((a, b) => duration(a) - duration(b));
					break;

				case "title":
				case "album":
				case "artist":
					arr.sort((a, b) => sortType(a).localeCompare(sortType(b)));
					break;

				case "score":
					arr.sort((a, b) => score(a) - score(b));
					break;

				case "plays":
			}

			if (sortingOrder == "highToLow") {
				arr.reverse();
			}

			return arr;
		}

		const fetchData = async () => {
			switch (filterType) {
				case "tracks":
					const trackIDs = await getTrackIds();
					const trackMetadata = await getTrackMetadataBulk(trackIDs);

					sortByUserChoice(trackMetadata);

					setView(
						<>
							{trackMetadata.map((track) => (
								<AlbumTrack
									track={track}
									onClick={() => {}}
									onContextMenu={() => {}}
									art={true}
								/>
							))}
						</>
					);
					break;

				case "albums":
					const albumIDs = await getAlbumIds();
					const albumMetadata = await getAlbumMetadataBulk(albumIDs);

					sortByUserChoice(albumMetadata);

					setView(
						<>
							{albumMetadata.map((album) => (
								<LargeAlbum
									album={album}
									onContextMenu={() => {}}
								/>
							))}
						</>
					);
					break;

				case "artists":
					const artistIDs = await getArtistIds();
					const artistMetadata =
						await getArtistMetadataBulk(artistIDs);

					sortByUserChoice(artistMetadata);

					setView(
						<>
							{artistMetadata.map((artist) => (
								<LargeArtist
									artist={artist}
									onContextMenu={() => {}}
								/>
							))}
						</>
					);
					break;

				case "playlists":
					const playlistIDs = await getPlaylistIds();
					const playlistMetadata =
						await getPlaylistMetadataBulk(playlistIDs);

					sortByUserChoice(playlistMetadata);

					setView(
						<>
							{playlistMetadata.map((playlist) => (
								<LargePlaylist
									playlist={playlist}
									onContextMenu={() => {}}
								/>
							))}
						</>
					);
			}
		};

		fetchData();
	}, [filterType, sortingOrder, sortingType]);

	return (
		<div>
			<div className={styles.header}>
				<div>
					<p>Filter:</p>
					<Dropdown
						options={[
							{
								name: "Tracks",
								icon: <AudioLines width={15} height={15} />,
								onSelect: () => setFilterType("tracks")
							},
							{
								name: "Albums",
								icon: <DiscAlbum width={15} height={15} />,
								onSelect: () => setFilterType("albums")
							},
							{
								name: "Artists",
								icon: <User width={15} height={15} />,
								onSelect: () => setFilterType("artists")
							},
							{
								name: "Playlists",
								icon: <ListVideo width={15} height={15} />,
								onSelect: () => setFilterType("playlists")
							}
						]}
					/>
				</div>

				<div>
					<p>Sort By:</p>
					<Dropdown
						options={[
							{
								name: "Duration",
								icon: <Timer width={15} height={15} />,
								onSelect: () => setSortingType("duration")
							},
							{
								name: "Plays",
								icon: <Play width={15} height={15} />,
								onSelect: () => setSortingType("plays")
							},
							{
								name: "Score",
								icon: <Star width={15} height={15} />,
								onSelect: () => setSortingType("score")
							},
							{
								name: "Title",
								icon: <Letters width={15} height={15} />,
								onSelect: () => setSortingType("title")
							},
							{
								name: "Album",
								icon: <DiscAlbum width={15} height={15} />,
								onSelect: () => setSortingType("album")
							},
							{
								name: "Artist",
								icon: <User width={15} height={15} />,
								onSelect: () => setSortingType("artist")
							}
						]}
					/>
				</div>

				<div>
					<p>Sorting Order:</p>
					<Dropdown
						options={[
							{
								name: "High to Low",
								icon: <ArrowDown width={15} height={15} />,
								onSelect: () => setSortingOrder("highToLow")
							},
							{
								name: "Low to High",
								icon: <ArrowUp width={15} height={15} />,
								onSelect: () => setSortingOrder("lowToHigh")
							}
						]}
					/>
				</div>
			</div>

			<div
				className={
					filterType == "tracks" ? styles.trackView : styles.gridView
				}
			>
				{view}
			</div>
		</div>
	);
}
