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
RUN apt-get update && apt-get install -y ca-certificates
WORKDIR /app
COPY --from=backend-builder /app/musica-server /app/musica-server
COPY --from=frontend-builder /app/public /app/public
EXPOSE 3000
CMD ["/app/musica-server"]
