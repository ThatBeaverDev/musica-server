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
			className="album-context-menu"
			style={{
				position: "fixed",
				left: `${x}px`,
				top: `${y}px`,
				zIndex: 1000
			}}
		>
			<p className="album-context-menu-title">{title}</p>

			{items.map((item) => (
				<p
					key={item.label}
					className="album-context-menu-item"
					onPointerDown={() => {
						item.action();
					}}
				>
					{item.label}
				</p>
			))}
		</div>
	);
}
