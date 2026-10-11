import { Subset } from "../musica";
import { Asterisk, Ellipsis, Home, LucideIcon, Map, Trash } from "lucide-react";

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

export function GetSubsetIcon(subset: Subset): LucideIcon {
	switch (subset) {
		case "standard":
			return Home;

		case "exploration":
			return Map;

		case "wildcard":
			return Asterisk;

		case "dislike":
			return Trash;

		case "other":
			return Ellipsis;
	}
}
