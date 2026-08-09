import { useEffect, useRef, useState } from "react";
import { player } from "../Player";
import { item2Colour, item3Colour, itemColour } from "../constants";

export default function ProgressBar() {
	const [outerIsHovered, setOuterIsHovered] = useState(false);
	const [outerIsActive, setOuterIsActive] = useState(false);
	const [innerWidth, setInnerWidth] = useState(0);

	const outerRef = useRef<HTMLDivElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);

	const progressIsDragged = useRef(false);
	const progressWasPlaying = useRef(false);

	const adjustTime = (event: MouseEvent) => {
		if (!outerRef.current || !innerRef.current) return;

		const rect = outerRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));

		innerRef.current.style.width = `${x}px`;

		const decimalProgression = x / rect.width;
		player.seek(player.audio.duration * decimalProgression);
	};

	useEffect(() => {
		const outerPointerdown = (event: PointerEvent) => {
			progressIsDragged.current = true;
			progressWasPlaying.current = player.isPlaying;
			player.pause();

			adjustTime(event);
		};
		const windowPointerUp = () => {
			progressIsDragged.current = false;

			if (progressWasPlaying.current) player.resume();
			// prevent unrelated clicks causing it to start playing
			progressWasPlaying.current = false;
		};
		const windowPointerMove = (event: PointerEvent) => {
			if (!progressIsDragged.current) return;

			adjustTime(event);
		};

		outerRef.current?.addEventListener?.("pointerdown", outerPointerdown);
		window.addEventListener("pointerup", windowPointerUp);
		window.addEventListener("pointermove", windowPointerMove);

		const refreshProgressbar = () => {
			if (!outerRef.current || !innerRef.current) return;
			const rect = outerRef.current.getBoundingClientRect();

			const decimalProgression =
				player.audio.currentTime / player.audio.duration;

			const progress = rect.width * decimalProgression;

			if (progress != innerWidth) {
				setInnerWidth(progress);
			}
		};

		let interval = setInterval(refreshProgressbar, 250);

		console.debug(interval);

		return () => {
			clearInterval(interval);

			outerRef.current?.removeEventListener?.(
				"pointerdown",
				outerPointerdown
			);
			window.removeEventListener("pointerup", windowPointerUp);
			window.removeEventListener("pointermove", windowPointerMove);
		};
	}, []);

	return (
		<div
			ref={outerRef}
			style={styles.outer(outerIsHovered, outerIsActive)}

			onMouseEnter={() => setOuterIsHovered(true)}
			onMouseLeave={() => setOuterIsHovered(false)}

			onMouseDown={() => setOuterIsActive(true)}
			onMouseUp={() => setOuterIsActive(false)}
		>
			<div
				ref={innerRef}
				style={styles.inner(outerIsHovered, outerIsActive, innerWidth)}
			></div>
		</div>
	);
}

const styles = {
	outer(hover: boolean, active: boolean) {
		return {
			width: "100%",
			height: "6px",

			overflow: "hidden",
			borderRadius: "1000px",

			margin: "5px 0px",

			background: hover || active ? item2Colour : itemColour,

			transition: "ease 0.2s"
		};
	},

	inner(outerHover: boolean, outerActive: boolean, width: number) {
		return {
			position: "relative" as const,
			left: "0px",
			top: "0px",

			width: `${width}px`,
			height: "100%",

			background: outerHover || outerActive ? item3Colour : item2Colour,
			transition: "ease 0.2s",

			pointerEvents: "none" as "none"
		};
	}
};
