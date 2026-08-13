package webServer

import (
	"fmt"
	identityStorage "musica-server/src"
	"musica-server/src/indexer"
	scores "musica-server/src/scores"
	search "musica-server/src/search"
	"net/http"
	"time"

	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
)

type WebServer struct {
	indexer *indexer.Indexer
	search  *search.SearchManager
	scores  *scores.ScoreManager

	router *chi.Mux

	identityStorage *identityStorage.IdentityStorage
}

func New(idx *indexer.Indexer, idStorage *identityStorage.IdentityStorage, scores *scores.ScoreManager) *WebServer {
	r := chi.NewRouter()
	r.Use(middleware.Compress(5))

	ws := &WebServer{
		indexer: idx,
		search:  search.NewSearcher(idx, scores),
		scores:  scores,

		router: r,

		identityStorage: idStorage,
	}

	api := chi.NewRouter()

	// Tracks
	api.Get("/tracks/list", ws.listTracks)
	api.Get("/tracks/randomMixTrack", ws.randomMixTrack)

	api.Get("/track/{id}/info", ws.trackInfo)
	api.Get("/track/{id}/get", ws.trackFile)
	api.Get("/track/{id}/art", ws.trackArt)
	api.Get("/track/{id}/colour", ws.trackColour)
	api.Get("/track/{id}/explicitPlay", ws.userSpecificPlay)
	api.Get("/track/{id}/played", ws.trackPlayed)
	api.Get("/track/{id}/skipped", ws.trackSkipped)

	api.Post("/bulk/tracks/info", ws.bulkTracks)

	// Albums
	api.Get("/albums/list", ws.listAlbums)
	api.Get("/album/{id}/info", ws.albumInfo)
	api.Get("/album/{id}/art", ws.albumArt)
	api.Get("/album/{id}/colour", ws.albumColour)
	api.Get("/bulk/albums/info", ws.bulkAlbums)

	// Artists
	api.Get("/artists/list", ws.listArtists)
	api.Get("/artist/{id}/info", ws.artistInfo)
	api.Get("/artist/{id}/art", ws.artistArtEndpoint)
	api.Get("/artist/{id}/colour", ws.artistColour)
	api.Get("/bulk/artists/info", ws.bulkArtists)

	// Search
	api.Get("/search/{query}", ws.searchQuery)

	r.Mount("/api", api)

	// Static files
	ws.static("/", "./public/index.html", "text/html")
	ws.static("/album/*", "./public/index.html", "text/html")
	ws.static("/artist/*", "./public/index.html", "text/html")
	ws.static("/search", "./public/index.html", "text/html")

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
	ws.static(
		"/img/standard.svg",
		"./public/img/standard.svg",
		"image/svg+xml",
	)
	ws.static(
		"/img/explore.svg",
		"./public/img/explore.svg",
		"image/svg+xml",
	)
	ws.static(
		"/img/wildcard.svg",
		"./public/img/wildcard.svg",
		"image/svg+xml",
	)
	ws.static(
		"/img/dislike.svg",
		"./public/img/dislike.svg",
		"image/svg+xml",
	)
	ws.static(
		"/img/other.svg",
		"./public/img/other.svg",
		"image/svg+xml",
	)

	// CSS
	ws.static("/styles/styles.css", "./public/styles.css", "text/css")

	// JS
	ws.static("/app.js", "./public/app.js", "text/javascript")

	// config
	ws.static("/manifest.webmanifest", "./public/manifest.webmanifest", "application/manifest+json")

	return ws
}

func (ws *WebServer) Listen(port int) error {
	addr := fmt.Sprintf("0.0.0.0:%d", port)

	srv := &http.Server{
		Addr:              addr,
		Handler:           ws.router,
		ReadTimeout:       10 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	fmt.Println("Server listening on", addr)
	return srv.ListenAndServe()
}
