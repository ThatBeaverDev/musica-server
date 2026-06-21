import Fastify, { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import Indexer from "../index/indexer.js";
import path from "node:path";
import fs from "node:fs";
import { mkdir } from "node:fs/promises";

export default class WebServer {
	server: FastifyInstance;

	constructor(public indexer: Indexer) {
		const server = Fastify();
		this.server = server;

		this.server.register(
			async (apiPlugin) => {
				apiPlugin.get<{
					Headers: { tracks: string /* string[] as string */ };
				}>("/bulk/tracks/info", async (request, reply) => {
					const tracks = JSON.parse(request.headers.tracks);

					if (!(tracks instanceof Array)) {
						return reply.status(400).send({
							error: "Tracks header must be conform to type string[] - An array was not given."
						});
					}

					const stats = tracks.map((id) => {
						const entry = this.indexer.index?.tracks?.[id];

						if (entry) return entry;
						else return null;
					});

					return reply.send(stats);
				});

				apiPlugin.get<{
					Params: { id: string };
				}>("/track/:id/info", async (request, reply) => {
					const { id } = request.params;

					const track = this.indexer.index?.tracks?.[id];
					if (!track) {
						return reply
							.status(404)
							.send({ error: "Track not found" });
					}

					return reply.send(track);
				});

				apiPlugin.get<{
					Params: { id: string };
				}>("/track/:id/art", async (request, reply) => {
					const { id } = request.params;

					const track = this.indexer.index?.tracks?.[id];
					if (!track) {
						return reply
							.status(404)
							.send({ error: "Track not found" });
					}

					const picture = await this.indexer.getCover(track);

					if (!picture) {
						reply.code(404).send({ error: "Track has no art." });
						return;
					}

					const filePath = path.resolve(picture.directory);
					const stat = await fs.promises.stat(filePath);

					const range = request.headers.range;

					if (!range) {
						// no seeking
						reply.header("Content-Length", stat.size);
						reply.header("Content-Type", picture.mime);
						return reply.send(fs.createReadStream(filePath));
					}

					// allow ranging
					const parts = range.replace(/bytes=/, "").split("-");
					const start = parseInt(parts[0], 10);
					const end = parts[1]
						? parseInt(parts[1], 10)
						: stat.size - 1;

					const chunkSize = end - start + 1;
					const stream = fs.createReadStream(filePath, {
						start,
						end
					});

					reply.status(206);
					reply.headers({
						"Content-Range": `bytes ${start}-${end}/${stat.size}`,
						"Accept-Ranges": "bytes",
						"Content-Length": chunkSize,
						"Content-Type": picture.mime
					});

					return reply.send(stream);
				});

				apiPlugin.get<{
					Params: { id: string };
				}>("/track/:id/get", async (request, reply) => {
					const { id } = request.params;

					const track = this.indexer.index?.tracks?.[id];
					if (!track) {
						return reply
							.status(404)
							.send({ error: "Track not found" });
					}

					const filePath = path.resolve(track.path);
					const stat = await fs.promises.stat(filePath);

					const range = request.headers.range;

					if (!range) {
						// no seeking
						reply.header("Content-Length", stat.size);
						reply.header("Content-Type", "audio/mpeg");
						return reply.send(fs.createReadStream(filePath));
					}

					// allow ranging
					const parts = range.replace(/bytes=/, "").split("-");
					const start = parseInt(parts[0], 10);
					const end = parts[1]
						? parseInt(parts[1], 10)
						: stat.size - 1;

					const chunkSize = end - start + 1;
					const stream = fs.createReadStream(filePath, {
						start,
						end
					});

					reply.status(206);
					reply.headers({
						"Content-Range": `bytes ${start}-${end}/${stat.size}`,
						"Accept-Ranges": "bytes",
						"Content-Length": chunkSize,
						"Content-Type": "audio/mpeg"
					});

					return reply.send(stream);
				});

				apiPlugin.get("/tracks/list", async (_, reply) => {
					const list = Object.keys(this.indexer.index?.tracks ?? {});

					return reply.send(list);
				});
			},
			{ prefix: "/api" }
		);

		server.register(fastifyStatic, {
			root: path.join(process.cwd(), "public"),
			prefix: "/",
			index: ["index.html"],
			wildcard: true
		});
	}

	async listen(port: number) {
		const exists = fs.existsSync("./mediaCache");
		if (!exists) await mkdir("./mediaCache");

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
