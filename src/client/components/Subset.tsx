import { useEffect, useState } from "react";
import { getSubsetColour, getSubsetIcon, getSubsetName } from "../lib/subset";
import { Subset } from "../musica";

interface SubsetDisplayProps {
	subset: Subset;
}

export default function SubsetDisplay({ subset }: SubsetDisplayProps) {
	const [svgContent, setSvgContent] = useState<string>("");

	const text = getSubsetName(subset);
	const iconUrl = getSubsetIcon(subset);
	const color = getSubsetColour(subset);

	useEffect(() => {
		let isMounted = true;

		async function fetchSvg() {
			try {
				const response = await fetch(iconUrl, { priority: "high" });
				const text = await response.text();
				if (isMounted) setSvgContent(text);
			} catch (err) {
				console.error("Failed to load subset icon", err);
			}
		}

		fetchSvg();
		return () => {
			isMounted = false;
		};
	}, [iconUrl]);

	return (
		<div
			style={{ ...styles.subset, color }}
			dangerouslySetInnerHTML={{
				__html: `${svgContent?.replaceAll?.("<svg", '<svg style="width: 15px; height: 15px;"') ?? ""}<span>${text}</span>`
			}}
		/>
	);
}

const styles = {
	subset: { display: "flex", flexDirection: "row" as "row", gap: "5px" }
};
