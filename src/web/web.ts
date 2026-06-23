import Fastify, { FastifyInstance } from "fastify";
import Indexer from "../index/indexer.js";
import path from "node:path";
import fs from "node:fs";
import { mkdir, readdir, readFile, rm, rmdir } from "node:fs/promises";
import { albumIdToSpecifier, specifierToAlbumId } from "../id.js";

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

				/* ========== ALBUMS ========== */
				apiPlugin.get<{
					Headers: { albums: string /* string[] as string */ };
				}>("/bulk/albums/info", async (request, reply) => {
					const albums = JSON.parse(request.headers.albums);

					if (!(albums instanceof Array)) {
						return reply.status(400).send({
							error: "Albums header must be conform to type string[] - An array was not given."
						});
					}

					const stats = albums.map((id) => {
						const specifier = albumIdToSpecifier(id);

						const album = this.indexer.index?.albums?.[specifier];

						if (album) return { ...album, id: id };
						else return null;
					});

					return reply.send(stats);
				});

				apiPlugin.get<{
					Params: { id: string };
				}>("/album/:id/info", async (request, reply) => {
					const { id } = request.params;
					const specifier = albumIdToSpecifier(id);

					const album = this.indexer.index?.albums?.[specifier];
					if (!album) {
						return reply
							.status(404)
							.send({ error: "Album not found" });
					}

					return reply.send({ ...album, id });
				});

				apiPlugin.get("/albums/list", async (_, reply) => {
					const list = Object.keys(this.indexer.index?.albums ?? {});

					return reply.send(
						list.map((item) => {
							const id = specifierToAlbumId(item);

							return id;
						})
					);
				});
			},
			{ prefix: "/api" }
		);

		const passthroughFile = (
			serverPath: string,
			filePath: string,
			contentType: string = "text/html"
		) => {
			server.get(serverPath, async (request, reply) => {
				try {
					reply.header("content-type", contentType);
					return reply.send(await readFile(filePath, "utf8"));
				} catch (e) {
					console.error(
						`DynamicGet[${filePath} -> ${serverPath}]:`,
						e
					);
					return reply.status(500).send({ error: String(e) });
				}
			});
		};

		const serve = (path: string) => {
			passthroughFile(path, "./public/index.html");
		};

		// pages
		serve("/");
		serve("/album/:id");
		serve("/artist/:id");
		//passthroughFile("/album/:id", "./public/dynamic/album.html");

		// css
		passthroughFile(
			"/styles/styles.css",
			"./public/styles/home.css",
			"text/css"
		);
		passthroughFile(
			"/styles/album.css",
			"./public/styles/album.css",
			"text/css"
		);
		passthroughFile(
			"/styles/player.css",
			"./public/styles/player.css",
			"text/css"
		);

		// images
		passthroughFile(
			"/favicon.svg",
			"./public/img/favicon.svg",
			"image/svg+xml"
		);
		passthroughFile(
			"/img/play.svg",
			"./public/img/play.svg",
			"image/svg+xml"
		);
		passthroughFile(
			"/img/pause.svg",
			"./public/img/pause.svg",
			"image/svg+xml"
		);
		passthroughFile(
			"/img/skip-forward.svg",
			"./public/img/skip-forward.svg",
			"image/svg+xml"
		);
		passthroughFile(
			"/img/skip-back.svg",
			"./public/img/skip-back.svg",
			"image/svg+xml"
		);

		// js
		passthroughFile("/app.js", "./public/app.js", "text/javascript");

		//server.register(fastifyStatic, {
		//	root: path.join(process.cwd(), "public"),
		//	prefix: "/",
		//	index: ["index.html"],
		//	wildcard: true
		//});
	}

	async listen(port: number) {
		async function deleteDirectory(dir: string) {
			const contents = await readdir(dir, { withFileTypes: true });

			for (const child of contents) {
				const directory = path.join(dir, child.name);

				if (child.isDirectory()) {
					await deleteDirectory(directory);
				} else {
					await rm(directory);
				}
			}

			await rmdir(dir);
		}

		console.debug("Deleting media cache.");
		try {
			await deleteDirectory("./mediaCache");
		} catch {}
		await mkdir("./mediaCache");
		console.debug("media cache deleted.");

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
