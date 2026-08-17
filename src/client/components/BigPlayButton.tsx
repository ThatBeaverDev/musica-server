import { useState } from "preact/hooks";
import React from "react";

export default function BigPlayButton({
	onClick,
	style,
	className
}: {
	className?: string;
	style?: React.HTMLAttributes<HTMLDivElement>["style"];
	onClick: () => void;
}) {
	const [hovered, setHovered] = useState(false);
	const [active, setActive] = useState(false);

	return (
		<div
			style={{ ...style, ...styles.outer(hovered, active) }}
			className={className}

			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => {
				setHovered(false);
				setActive(false);
			}}

			onMouseDown={() => setActive(true)}
			onMouseUp={() => setActive(false)}

			onClick={() => onClick()}
		>
			<img src="/img/play.svg" style={styles.icon} />

			<p style={styles.text}>Play</p>
		</div>
	);
}

const styles = {
	outer(hovered: boolean, active: boolean) {
		return {
			display: "flex",
			flexDirection: "row" as "row",
			alignItems: "center" as "center",
			gap: "1rem",

			borderRadius: "100px",
			backgroundColor: "white",

			width: "max-content",

			padding: "10px",
			paddingLeft: "2rem",
			paddingRight: "2rem",

			marginTop: "1rem",

			transform: hovered ? (active ? "scale(0.95)" : "scale(1.1)") : "",
			transition: "ease 0.2s",

			boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)"
		};
	},

	icon: {
		width: "20px",
		height: "20px",
		userSelect: "none" as "none",
		pointerEvents: "none" as "none"
	},

	text: {
		color: "black",
		verticalAlign: "center",
		userSelect: "none" as "none",
		pointerEvents: "none" as "none"
	}
};
