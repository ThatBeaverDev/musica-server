import { Subset } from "../musica";

export function getSubsetName(subset: Subset) {
	switch (subset) {
		case "standard":
			return "Home";

		case "exploration":
			return "Exploration";

		case "wildcard":
			return "Wildcard";

		case "dislike":
			return "Disliked";

		case "other":
			return "Others";
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

		case "dislike":
			return "#523232";

		case "other":
			return "#fff";
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

		case "dislike":
			return "/img/dislike.svg";

		case "other":
			return "/img/other.svg";
	}
}
