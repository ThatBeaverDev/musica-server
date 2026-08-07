FROM golang:1.26.5-trixie
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o /musica-server
EXPOSE 3000
CMD ["/musica-server"]
