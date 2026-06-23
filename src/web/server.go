package webServer

import (
	"fmt"
	identityStorage "musica-server/src"
	"musica-server/src/indexer"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type WebServer struct {
	indexer *indexer.Indexer
	router  *chi.Mux

	identityStorage *identityStorage.IdentityStorage
}

func New(idx *indexer.Indexer, idStorage *identityStorage.IdentityStorage) *WebServer {
	r := chi.NewRouter()

	ws := &WebServer{
		indexer: idx,
		router:  r,

		identityStorage: idStorage,
	}

	api := chi.NewRouter()

	// =====================
	// TRACKS
	// =====================

	api.Get("/tracks/list", ws.listTracks)

	api.Get("/track/{id}/info", ws.trackInfo)
	api.Get("/track/{id}/get", ws.trackFile)
	api.Get("/track/{id}/art", ws.trackArt)

	api.Post("/bulk/tracks/info", ws.bulkTracks)

	// =====================
	// ALBUMS
	// =====================

	api.Get("/albums/list", ws.listAlbums)
	api.Get("/album/{id}/info", ws.albumInfo)
	api.Get("/bulk/albums/info", ws.bulkAlbums)

	r.Mount("/api", api)

	// =====================
	// STATIC FILES
	// =====================

	ws.static("/", "./public/index.html", "text/html")
	ws.static("/album/*", "./public/index.html", "text/html")
	ws.static("/artist/*", "./public/index.html", "text/html")

	ws.static(
		"/apple-touch-icon.png",
		"./public/img/apple-touch-icon.png",
		"image/png",
	)
	ws.static(
		"/favicon-96x96.png",
		"./public/img/favicon-96x96.png",
		"image/png",
	)
	ws.static(
		"/favicon.ico",
		"./public/img/favicon.ico",
		"image/x-icon",
	)
	ws.static(
		"/favicon.svg",
		"./public/img/favicon.svg",
		"image/svg+xml",
	)
	ws.static(
		"/web-app-manifest-192x192.png",
		"./public/img/web-app-manifest-192x192.png",
		"image/png",
	)
	ws.static(
		"/web-app-manifest-512x512.png",
		"./public/img/web-app-manifest-512x512.png",
		"image/png",
	)

	ws.static(
		"/img/play.svg",
		"./public/img/play.svg",
		"image/svg+xml",
	)
	ws.static(
		"/img/pause.svg",
		"./public/img/pause.svg",
		"image/svg+xml",
	)
	ws.static(
		"/img/skip-forward.svg",
		"./public/img/skip-forward.svg",
		"image/svg+xml",
	)
	ws.static(
		"/img/skip-back.svg",
		"./public/img/skip-back.svg",
		"image/svg+xml",
	)

	// CSS
	ws.static("/styles/styles.css", "./public/styles/home.css", "text/css")
	ws.static("/styles/album.css", "./public/styles/album.css", "text/css")
	ws.static("/styles/player.css", "./public/styles/player.css", "text/css")
	ws.static("/styles/desktop.css", "./public/styles/desktop.css", "text/css")
	ws.static("/styles/mobile.css", "./public/styles/mobile.css", "text/css")

	// JS
	ws.static("/app.js", "./public/app.js", "text/javascript")

	// config
	ws.static("/manifest.webmanifest", "./public/manifest.webmanifest", "application/manifest+json")

	return ws
}

func (ws *WebServer) Listen(port int) error {
	addr := fmt.Sprintf("0.0.0.0:%d", port)

	fmt.Println("Server listening on", addr)
	return http.ListenAndServe(addr, ws.router)
}
