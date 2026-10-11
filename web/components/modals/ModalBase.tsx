import { useEffect } from "preact/hooks";
import styles from "./modalBase.module.css";
import React from "react";

export default function ModalBase({
	children,
	title,
	description
}: {
	children?: React.ReactNode | React.ReactNode[];
	title: string;
	description?: string;
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
			<h1>{title}</h1>
			{description ? <p>{description}</p> : undefined}
			{children}
		</div>
	);
}
