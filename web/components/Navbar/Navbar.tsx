import { useNavigate } from "react-router-dom";
import { player } from "../../Player";
import styles from "./navbar.module.css";
import {
	FileMusic,
	Grid2x2,
	HomeIcon,
	RouteIcon,
	SearchIcon
} from "lucide-react";

function NavItem({
	children,
	onClick,
	icon
}: {
	children: string;
	onClick: () => void;
	icon?: React.JSX.Element;
}) {
	return (
		<div
			className={styles.navItem}

			onClick={onClick}
		>
			{icon}
			{children}
		</div>
	);
}

export default function Topbar({ mobile }: { mobile: boolean }) {
	const navigate = useNavigate();

	return (
		<div className={styles.navbar}>
			{mobile ? undefined : (
				<>
					<FileMusic />
					<h2 style={{ paddingLeft: "0.25rem" }}>Musica</h2>
				</>
			)}

			<div className={styles.navItemContainer}>
				<NavItem
					onClick={() => navigate("/")}
					icon={<HomeIcon className={styles.navItemIcon} />}
				>
					Home
				</NavItem>
				<NavItem
					onClick={() => navigate("/search")}
					icon={<SearchIcon className={styles.navItemIcon} />}
				>
					Search
				</NavItem>
				<NavItem
					onClick={() => navigate("/library")}
					icon={<Grid2x2 className={styles.navItemIcon} />}
				>
					Library
				</NavItem>
				<NavItem
					onClick={async () => {
						await player.startDynamicQueue();
					}}
					icon={<RouteIcon className={styles.navItemIcon} />}
				>
					Dynamic Queue
				</NavItem>
			</div>
		</div>
	);
}
