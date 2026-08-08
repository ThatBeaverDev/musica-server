import { Subset } from "../musica";

export function getSubsetName(subset: Subset) {
	switch (subset) {
		case "standard":
			return "Home";

		case "exploration":
			return "Exploration";

		case "wildcard":
			return "Wildcard";

		default:
			return "Unknown";
	}
}

export function getSubsetColour(subset: Subset) {
	switch (subset) {
		case "standard":
			return "#14A626";

		case "exploration":
			return "#DED223";

		case "wildcard":
			return "#DE2323";

		default:
			return "#888";
	}
}

export function getSubsetIcon(subset: Subset) {
	switch (subset) {
		case "standard":
			return "/img/standard.svg";

		case "exploration":
			return "/img/explore.svg";

		case "wildcard":
			return "/img/wildcard.svg";
	}
}
