import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./Dropdown.module.css";

interface DropdownSelection {
	name: string;
	icon?: React.JSX.Element;
	onSelect: () => void;
}

export default function Dropdown({
	options
}: {
	options: DropdownSelection[];
}) {
	const [currentSelection, setSelection] = useState<DropdownSelection>(
		options[0]
	);

	const [isOpen, setIsOpen] = useState<boolean>(false);

	useEffect(() => {
		const onClick = () => {
			setIsOpen(false);
		};

		if (isOpen) {
			window.addEventListener("click", onClick);

			return () => {
				window.removeEventListener("click", onClick);
			};
		}
	});

	return (
		<div
			className={styles.outer}
			onClick={() => {
				if (!isOpen) setIsOpen(true);
			}}
		>
			<div className={`${styles.top} ${isOpen ? styles.topOpen : ""}`}>
				{currentSelection.icon}

				<span>{currentSelection.name}</span>

				<ChevronDown
					className={styles.chevron}
					width={20}
					height={20}
				/>
			</div>

			{isOpen ? (
				<div className={styles.lower}>
					{options.map((item) => (
						<p
							className={`${styles.dropdownItem} ${item == currentSelection ? styles.selectedDropdown : ""}`}
							onClick={() => {
								setSelection(item);
							}}
						>
							{item.icon}

							{item.name}
						</p>
					))}
				</div>
			) : undefined}
		</div>
	);
}
