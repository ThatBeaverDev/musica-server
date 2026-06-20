import path from "node:path";

const idSet = new Map<string, number>();
let i = 0;

export function getId(dir: string) {
	const directory = path.join(process.cwd(), dir);

	if (idSet.has(directory)) {
		return `${idSet.get(directory)}`;
	} else {
		const id = i++;
		idSet.set(directory, id);
		return `${id}`;
	}
}
