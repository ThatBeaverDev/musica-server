# frontend (tsx)
FROM node:24-alpine AS frontend-builder
WORKDIR /app
RUN apk update && apk add rsync
COPY package*.json ./
RUN npm ci
COPY . .
RUN ./build:frontend.sh

# backend (go)
FROM golang:1.27.0-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o musica-server .

# merge it
FROM alpine:3.20
RUN apk add --no-cache \
    ca-certificates \
    su-exec

WORKDIR /app
COPY --from=backend-builder /app/musica-server ./musica-server
COPY --from=frontend-builder /app/public ./public
COPY --chown=root:root docker_entrypoint.sh /usr/local/bin/entrypoint.sh
# write static config file
RUN echo '{"mediaLibrary": "/app/audio", "scores": "/app/data/scores.json", "history": "/app/data/history.json"}' > /app/config.json

RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/app/musica-server"]
