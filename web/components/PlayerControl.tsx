import styles from "./PlayerControl.module.css";

interface PlayerControlParams {
	className: string;
	style: Object;
}

export default function PlayerControl({
	icon: Icon,
	width,
	height
}: {
	icon: (params: PlayerControlParams) => React.JSX.Element;
	width?: string;
	height?: string;
}) {
	return (
		<Icon
			className={styles.playerControl}

			style={{
				width: width ?? "30px",
				height: height ?? "30px"
			}}
		/>
	);
}
