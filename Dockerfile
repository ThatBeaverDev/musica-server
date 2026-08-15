# frontend (tsx)
FROM node:24 AS frontend-builder
WORKDIR /app
COPY . .
RUN npm install
RUN npx tsc
RUN npx rollup -c

# backend (go)
FROM golang:1.26.6 AS backend-builder
WORKDIR /app
COPY . .
RUN go mod download
RUN GOOS=linux go build -o musica-server .

# merge it
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    gosu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=backend-builder /app/musica-server /app/musica-server
COPY --from=frontend-builder /app/public /app/public
COPY docker_entrypoint.sh /usr/local/bin/entrypoint.sh
# write static config file
RUN echo '{"mediaLibrary": "/app/audio", "scores": "/app/data/scores.json", "history": "/app/data/history.json"}' > /app/config.json

RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/app/musica-server"]
