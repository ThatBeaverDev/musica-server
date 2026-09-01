import { useRef, useState } from "react";
import { Track } from "../../musica";
import { useEffect } from "preact/hooks";
import { beforeTrackUpdate, getTrackMetadata } from "../../lib/metadata";
import { getItemColours } from "../../lib/colour";
import { colourScore } from "../../lib/score";
import styles from "./editTrack.module.css";
import { useNavigate } from "react-router-dom";

function FileInput({
	name,
	onChange
}: {
	name: string;
	onChange: (value: File) => void;
}) {
	const ref = useRef<HTMLInputElement | null>(null);

	return (
		<div className={styles.valuePairOuter}>
			<p className={styles.valuePairText}>{name}</p>
			<div className={styles.valuePairInputContainer}>
				<input
					className={styles.valuePairInput}
					type="file"
					ref={ref}
					multiple={false}
					onChange={() => {
						if (!ref.current) return;

						const input: HTMLInputElement = ref.current!;
						const file = input.files?.[0];
						if (file) {
							onChange(file);
						}
					}}
				/>
			</div>
		</div>
	);
}

function ValuePair({
	name,
	onChange,
	initialValue,
	autofillItems = []
}: {
	name: string;
	onChange: (value: string) => void;
	initialValue: string;
	autofillItems?: string[];
}) {
	const [value, setValue] = useState(initialValue);
	const listId = `${name}-list`;

	const changed = value != initialValue;

	return (
		<div className={styles.valuePairOuter}>
			<p className={styles.valuePairText}>{name}</p>
			<div className={styles.valuePairInputContainer}>
				<input
					className={styles.valuePairInput}
					type="text"
					value={value}
					list={listId}
					onChange={(event) => {
						setValue(event.target.value);
						onChange(event.target.value);
					}}
				/>
				{autofillItems.length > 0 && (
					<datalist id={listId}>
						{autofillItems.map((item, index) => (
							<option key={index} value={item} />
						))}
					</datalist>
				)}
				{changed ? (
					<img
						onClick={() => {
							setValue(initialValue);
							onChange(initialValue);
						}}
						src="/img/reset.svg"
						className={styles.valuePairResetButton}
					/>
				) : undefined}
			</div>
		</div>
	);
}

export default function EditTrack() {
	const [track, setTrack] = useState<Track | undefined>();
	const [colours, setColours] = useState<[string, string] | undefined>();

	const id = new URL(window.location.href).pathname.split("/")[3];
	const navigate = useNavigate();

	useEffect(() => {
		let isMounted = true;

		const fetchTrack = async () => {
			try {
				const track = await getTrackMetadata(id);

				if (isMounted) {
					setTrack(track);

					setTitle(track.title);
					setAlbum(track.album);
					setAlbumArtist(track.albumArtist);
					setArtist(track.artist);
					setNumber(track.number ?? 0);

					const [colour, darker] = await getItemColours("track", id);

					if (isMounted) {
						setColours([colour, darker]);
					}
				}
			} catch (error) {
				console.error("Error loading track:", error);
			}
		};

		fetchTrack();

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
	}, [colours]);

	const icon = track ? `/api/track/${track.id}/art` : undefined;
	document.title = track
		? `Edit ${track.title} by ${track.artist} - Musica`
		: "Edit Track Metadata - Musica";

	const [title, setTitle] = useState(track?.title ?? "");
	const isNewTitle = (track?.title ?? "") != title;

	const [album, setAlbum] = useState(track?.album ?? "");
	const isNewAlbum = (track?.album ?? "") != album;

	const [albumArtist, setAlbumArtist] = useState(track?.albumArtist ?? "");
	const isNewAlbumArtist = (track?.albumArtist ?? "") != albumArtist;

	const [artist, setArtist] = useState(track?.artist ?? "");
	const isNewArtist = (track?.artist ?? "") != artist;

	const [number, setNumber] = useState(track?.number ?? 0);
	const isNewNumber = (track?.number ?? 0) != number;

	const [discNumber, setDiscNumber] = useState(track?.discNumber ?? 0);
	const isNewDiscNumber = (track?.discNumber ?? 0) != discNumber;

	const changesPresent =
		isNewTitle ||
		isNewAlbum ||
		isNewArtist ||
		isNewAlbumArtist ||
		isNewNumber ||
		isNewDiscNumber;

	const [art, setTrackArt] = useState<File | undefined>(undefined);
	const artChanged = art != undefined;

	async function applyMetadataChanges() {
		if (!track) return;
		beforeTrackUpdate(track);

		const changes = {
			title: isNewTitle ? title : undefined,
			album: isNewAlbum ? album : undefined,
			artist: isNewArtist ? artist : undefined,
			albumArtist: isNewAlbumArtist ? albumArtist : undefined,
			number: isNewNumber ? number : undefined,
			discNumber: isNewDiscNumber ? discNumber : undefined
		};

		const request = await fetch(`/api/track/${id}/editMetadata`, {
			method: "POST",
			body: JSON.stringify(changes)
		});

		await request.text();

		navigate("/");
	}

	async function applyArtChanges() {
		if (!track) return;
		if (!art) return;

		console.debug(art);

		const request = await fetch(`/api/track/${id}/editArt`, {
			method: "POST",
			body: art,
			headers: {
				"Content-Type": art.type || "application/octet-stream"
			}
		});

		await request.text();
	}

	return (
		<>
			<div className={styles.hero}>
				<img className={styles.art} src={icon} />

				<div>
					<p className={styles.text}>Track (editing)</p>

					<h1 className={styles.title}>
						{track?.title ?? "Loading Track Metadata..."}
					</h1>

					<p className={styles.text}>
						{track ? (
							<>
								<span>{track.artist}</span>
								<span>
									{track.release
										? ` (${new Date(track.release).getFullYear()})`
										: ""}
								</span>
							</>
						) : undefined}
					</p>
					<p
						className={styles.text}

						style={{
							color: track ? colourScore(track.score) : ""
						}}
					>
						{track ? `Score: ${Math.round(track.score)}` : ""}
					</p>
				</div>
			</div>

			<div>
				<h3>Metadata</h3>

				{track ? (
					<>
						<FileInput
							name="Track Art"
							onChange={(value) => setTrackArt(value)}
						/>

						{artChanged || true ? (
							<div
								onClick={() => applyArtChanges()}
								className={styles.submitButton}
								style={{
									background: colours ? colours[0] : undefined
								}}
							>
								Apply
							</div>
						) : undefined}

						<ValuePair
							name="Title"
							onChange={(value) => setTitle(value)}
							initialValue={track.title}
						/>
						<ValuePair
							name="Album"
							onChange={(value) => setAlbum(value)}
							initialValue={track.album}
							autofillItems={["ag", "h", "fe"]}
						/>
						<ValuePair
							name="Album Artist"
							onChange={(value) => setAlbumArtist(value)}
							initialValue={track.albumArtist}
						/>
						<ValuePair
							name="Artist"
							onChange={(value) => setArtist(value)}
							initialValue={track.artist}
						/>
						<ValuePair
							name="Number"
							onChange={(value) => setNumber(Number(value))}
							initialValue={`${track.number}`}
						/>
						<ValuePair
							name="Disc Number"
							onChange={(value) => setDiscNumber(Number(value))}
							initialValue={`${track.discNumber}`}
						/>

						{changesPresent ? (
							<div
								onClick={() => applyMetadataChanges()}
								className={styles.submitButton}
								style={{
									background: colours ? colours[0] : undefined
								}}
							>
								Apply
							</div>
						) : undefined}
					</>
				) : (
					<p>Loading, Please wait...</p>
				)}
			</div>
		</>
	);
}
