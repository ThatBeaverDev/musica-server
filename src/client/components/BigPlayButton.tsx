import React from "react";
import styles from "./BigPlayButton.module.css";

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
			<img src="/img/play.svg" className={styles.icon} />

			<p className={styles.text}>Play</p>
		</div>
	);
}
