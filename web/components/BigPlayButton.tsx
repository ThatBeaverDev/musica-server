import React from "react";
import styles from "./BigPlayButton.module.css";
import { Play } from "@filled-lucide/react";

export default function BigPlayButton({
	onClick,
	style,
	className
}: {
	className?: string;
	style?: React.HTMLAttributes<HTMLDivElement>["style"];
	onClick: () => void;
}) {
	return (
		<div
			style={style}
			className={`${styles.outer} ${className}`}

			onClick={() => onClick()}
		>
			<Play className={styles.icon} color="#000000" />
			<p className={styles.text}>Play</p>
		</div>
	);
}
