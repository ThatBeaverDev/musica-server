import { useState, useEffect } from "react";
import styles from "./ContextMenu.module.css";

export type ContextItems = {
	label: string;
	colour?: string;
	action: () => void;
	icon: React.JSX.Element;
}[];

export type ContextMenuRequiredEvent = {
	clientX: number;
	clientY: number;
	preventDefault(): void;
};

export function contextMenuHelper<T>() {
	// context menu, close on any mouse press
	const [contextMenu, setContextMenu] = useState<{
		x: number;
		y: number;
		data: T;
	} | null>(null);

	useEffect(() => {
		if (!contextMenu) return;

		const handleClose = () => {
			setContextMenu(null);

			window.removeEventListener("pointerdown", handleClose);
			window.removeEventListener("keydown", keydown);
		};

		window.addEventListener("pointerdown", handleClose);

		const keydown = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() == "escape") {
				handleClose();
			}
		};
		window.addEventListener("keydown", keydown);
	}, [contextMenu]);

	const activateContextMenu = (e: ContextMenuRequiredEvent, data: T) => {
		e.preventDefault();
		setContextMenu({
			x: e.clientX,
			y: e.clientY,
			data
		});
	};

	return { contextMenu, activateContextMenu };
}

function ContextEntry({
	label,
	colour,
	onClick,
	icon
}: {
	label: string;
	colour?: string;
	onClick: () => void;
	icon: React.JSX.Element;
}) {
	return (
		<p
			className={styles.item}
			style={{ color: colour }}

			onPointerDown={() => {
				onClick();
			}}
		>
			{icon}
			<span>{label}</span>
		</p>
	);
}

export default function ContextMenu({
	x: xPos,
	y,

	title,
	items
}: {
	x: number;
	y: number;

	title: string;
	items: ContextItems;
}) {
	let x = xPos;

	const screenWidth = window.innerWidth;
	if (x + 250 > screenWidth) {
		// render it on the other side of the cursor
		x -= 250;
	}

	const screenHeight = window.innerHeight;
	const menuHeight = 74 + 36 * items.length;
	if (y + menuHeight > screenHeight) {
		// render it on the other side of the cursor
		y -= menuHeight;
	}

	return (
		<div
			className={styles.menu}

			style={{
				position: "fixed",
				left: `${x}px`,
				top: `${y}px`,
				zIndex: 1000
			}}
		>
			<h1 className={styles.title}>{title}</h1>

			{items.map((item, index) => (
				<ContextEntry
					key={index}
					colour={item.colour}
					icon={item.icon}
					label={item.label}
					onClick={() => item.action()}
				></ContextEntry>
			))}
		</div>
	);
}
