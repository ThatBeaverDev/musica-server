import { useState } from "preact/hooks";

function ContextEntry({
	label,
	onClick
}: {
	label: string;
	onClick: () => void;
}) {
	const [hover, setIsHovered] = useState(false);

	return (
		<p
			style={styles.item(hover)}

			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}

			onClick={() => {
				onClick();
			}}
		>
			{label}
		</p>
	);
}

export default function ContextMenu({
	x,
	y,

	title,
	items
}: {
	x: number;
	y: number;

	title: string;
	items: { label: string; action: Function }[];
}) {
	return (
		<div
			style={{
				...styles.menu,
				position: "fixed",
				left: `${x}px`,
				top: `${y}px`,
				zIndex: 1000
			}}
		>
			<p style={styles.title}>{title}</p>

			{items.map((item, index) => (
				<ContextEntry
					key={index}
					label={item.label}
					onClick={() => item.action()}
				></ContextEntry>
			))}
		</div>
	);
}

const contextMenuEntryBase = {
	width: "100%",

	padding: "10px",

	marginLeft: "0px",

	borderTop: "1px solid rgba(255, 255, 255, 0.15)",
	borderBottom: "1px solid rgba(255, 255, 255, 0.15)"
};

const styles = {
	menu: {
		display: "flex",
		flexDirection: "column" as "column",

		width: "250px",
		overflow: "hidden",

		backgroundColor: "rgb(58 58 58)",
		border: "2px solid rgba(255, 255, 255, 0.06)",

		borderRadius: "14px"
	},

	title: {
		...contextMenuEntryBase,

		fontSize: "1rem"
	},

	item(hover: boolean) {
		return {
			...contextMenuEntryBase,

			backgroundColor: hover ? "rgb(71, 71, 71)" : "",
			transition: "ease 0.2s",

			fontSize: "0.95rem"
		};
	}
};
