import { useEffect } from "preact/hooks";
import styles from "./modalBase.module.css";
import React from "react";

export default function ModalBase({
	children,
	title
}: {
	children?: React.ReactNode | React.ReactNode[];
	title: string;
}) {
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key == "Escape") {
				window.setModal(undefined);
			}
		}

		window.addEventListener("keydown", onKeyDown);

		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, []);

	return (
		<div className={styles.container}>
			<p>{title}</p>
			{children}
		</div>
	);
}
