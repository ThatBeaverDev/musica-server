import styles from "./Tabs.module.css";

export interface TabsParams {
	items: { image: string; label: string; onClick: () => void }[];
}

export default function Tabs({ items }: TabsParams) {
	return (
		<div className={styles.outer}>
			{items.map((item) => (
				<div className={styles.item}>{item.label}</div>
			))}
		</div>
	);
}
