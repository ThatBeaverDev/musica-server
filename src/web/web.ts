import Fastify, { FastifyInstance, RouteHandlerMethod } from "fastify";
import fastifyStatic from "@fastify/static";
import Indexer from "../index/indexer";
import { readFile } from "node:fs/promises";

export default class WebServer {
	server: FastifyInstance;

	constructor(public indexer: Indexer) {
		const server = Fastify({
			logger: true
		});
		this.server = server;

		server.register(fastifyStatic, {
			root: process.cwd(),
			acceptRanges: true, // let's us send parts of files
			serve: false // don't serve stuff
		});

		server.get<{
			Headers: { "track-id"?: string };
		}>("/api/track-info", async (request, reply) => {
			const id = request.headers["track-id"];

			if (!id || typeof id !== "string") {
				return reply.status(400).send({ error: "Track ID required" });
			}

			const stats = this.indexer.index?.items?.[id];

			if (!stats) {
				return reply.status(404).send({ error: "Track not found" });
			}

			return stats;
		});

		server.get<{
			Params: { id: string };
		}>("/api/track/:id", async (request, reply) => {
			const { id } = request.params;
			const track = this.indexer.index?.items?.[id];

			if (!track) {
				return reply.status(404).send({ error: "Track not found" });
			}

			// reply.sendFile will stream the file natively and handle HTTP Range headers perfectly
			// track.path is the relative path
			return reply.sendFile(track.path);
		});
	}

	async listen(port: number) {
		try {
			const address = await this.server.listen({
				port: port,
				host: "0.0.0.0"
			});
			this.server.log.info(`Server listening on ${address}`);
		} catch (err) {
			this.server.log.error(err);
			process.exit(1);
		}
	}
}
