import { getSubsetColour, GetSubsetIcon, getSubsetName } from "../lib/subset";
import { Subset } from "../musica";

interface SubsetDisplayProps {
	subset: Subset;
}

export default function SubsetDisplay({ subset }: SubsetDisplayProps) {
	const text = getSubsetName(subset);
	const SubsetIcon = GetSubsetIcon(subset);
	const color = getSubsetColour(subset);

	return (
		<div style={{ ...styles.subset }}>
			<SubsetIcon width={15} height={15} color={color} />
			<span style={{ color: color }}>{text}</span>
		</div>
	);
}

const styles = {
	subset: { display: "flex", flexDirection: "row" as "row", gap: "5px" }
};
