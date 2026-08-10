import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { player } from "./Player";

function NavItem({
	children,
	onClick
}: {
	children: string;
	onClick: () => void;
}) {
	const [isHovered, setIsHovered] = useState(false);
	const [isActive, setIsActive] = useState(false);

	return (
		<div
			style={styles.navItem(isHovered, isActive)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}

			onMouseDown={() => setIsActive(true)}
			onMouseUp={() => setIsActive(false)}

			onClick={onClick}
		>
			{children}
		</div>
	);
}

export default function Topbar() {
	const navigate = useNavigate();

	return (
		<div style={styles.navbar}>
			<h2>Musica</h2>

			<div style={styles.nav}>
				<NavItem onClick={() => navigate("/")}>Home</NavItem>
				<NavItem onClick={() => navigate("/search")}>Search</NavItem>
				<NavItem onClick={() => navigate("/library")}>Library</NavItem>
				<NavItem
					onClick={() => {
						player.startDynamicQueue();
						player.resume();
					}}
				>
					Dynamic Queue
				</NavItem>
			</div>
		</div>
	);
}

const styles = {
	navbar: {
		position: "absolute" as "absolute",
		left: "0px",
		top: "0px",

		width: "100dvw",
		height: "50px",

		padding: "12px",
		background: "#181818",
		borderRight: "1px solid rgba(255, 255, 255, 0.06)",

		display: "flex",
		flexDirection: "row" as "row"
	},

	title: {
		height: "100%",
		margin: 0,

		fontSize: "1.5rem",
		fontWeight: 700
	},

	nav: {
		display: "flex",
		flexDirection: "row" as "row",
		gap: "20px",

		padding: "0 20px",

		justifyContent: "center",
		alignItems: "center"
	},

	navItem(hover: boolean, active: boolean) {
		return {
			padding: "10px",
			borderRadius: "6px",
			cursor: "pointer",
			transition: "0.2s",

			color: hover || active ? "white" : "#bbb",
			background: hover
				? active
					? "rgba(255, 255, 255, 0.1)"
					: "rgba(255, 255, 255, 0.05)"
				: ""
		};
	}
};
