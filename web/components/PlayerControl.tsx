import styles from "./PlayerControl.module.css";

export default function PlayerControl({
	src,
	width,
	height,
	onClick
}: {
	src: string;
	width?: string;
	height?: string;
	onClick: () => void;
}) {
	return (
		<img
			className={styles.playerControl}

			style={{
				width: width ?? "30px",
				height: height ?? "30px"
			}}

			src={src}
			draggable="false"
			onClick={() => onClick()}
		/>
	);
}
