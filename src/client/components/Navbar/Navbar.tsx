import { useNavigate } from "react-router-dom";
import { player } from "../../Player";
import styles from "./navbar.module.css";

function NavItem({
	children,
	onClick
}: {
	children: string;
	onClick: () => void;
}) {
	return (
		<div
			className={styles.navItem}

			onClick={onClick}
		>
			{children}
		</div>
	);
}

export default function Topbar() {
	const navigate = useNavigate();

	return (
		<div className={styles.navbar}>
			<h2>Musica</h2>

			<div className={styles.navItemContainer}>
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
