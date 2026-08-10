import { useState } from "preact/hooks";

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
	const [isHovered, setIsHovered] = useState(false);
	const [isActive, setIsActive] = useState(false);

	return (
		<img
			style={{
				...styles.playerControl(isHovered, isActive),
				width: width ?? "30px",
				height: height ?? "30px"
			}}

			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}

			onMouseDown={() => setIsActive(true)}
			onMouseUp={() => setIsActive(false)}

			src={src}
			draggable="false"
			onClick={() => onClick()}
		/>
	);
}

const styles = {
	playerControl(hovered: boolean, active: boolean) {
		return {
			filter: "invert(100%)",
			margin: "10px",

			transition: "0.2s ease",

			userSelect: "none" as "none",

			transform: hovered
				? active
					? "scale(0.75)"
					: "scale(1.1)"
				: undefined
		};
	}
};
