import Indexer from "./index/indexer.js";
import * as path from "node:path";
import WebServer from "./web/web.js";

async function main() {
	const indexer = new Indexer(path.resolve(process.cwd(), "./audio"));
	await indexer.init();

	const server = new WebServer(indexer);

	await server.listen(3000);
}

main();
