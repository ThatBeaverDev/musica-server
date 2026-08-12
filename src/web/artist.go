package webServer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"musica-server/src/indexer"
	webTypes "musica-server/src/types"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
)

func (ws *WebServer) listArtists(w http.ResponseWriter, r *http.Request) {
	var list []string

	for id := range ws.indexer.Index.Artists {
		list = append(list, id)
	}

	var buf bytes.Buffer

	err := json.NewEncoder(&buf).Encode(list)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(buf.Bytes())
}

func (ws *WebServer) artistInfo(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	artist, ok := ws.indexer.Index.Artists[id]
	if !ok {
		http.Error(w, "Artist not found", 404)
		return
	}

	webExported := webTypes.ArtistToWeb(artist, ws.scores)

	json.NewEncoder(w).Encode(webExported)
}

func (ws *WebServer) bulkArtists(w http.ResponseWriter, r *http.Request) {
	artistsHeader := r.Header.Get("artists")
	if artistsHeader == "" {
		http.Error(w, "Artists to receive bulk properties for must be specified in the 'artists' header.", http.StatusBadRequest)
		return
	}

	if len(artistsHeader) > 20000 {
		http.Error(w, "Too many characters in `artists` header", http.StatusBadRequest)
		return
	}

	var ids []string
	if err := json.Unmarshal([]byte(artistsHeader), &ids); err != nil {
		http.Error(w, "Invalid artists header: "+err.Error(), http.StatusBadRequest)
		return
	}

	var result []*webTypes.WebExportedArtist

	for _, id := range ids {
		if artist, ok := ws.indexer.Index.Artists[id]; ok {
			webExported := webTypes.ArtistToWeb(artist, ws.scores)

			result = append(result, webExported)
		}
	}

	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (ws *WebServer) artistArt(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	artist, ok := ws.indexer.Index.Artists[id]
	if !ok {
		http.Error(w, "Artist not found", http.StatusNotFound)
		return
	}

	cover, err := ws.indexer.GetCover(*artist.Albums[0].Tracks[0])
	if err != nil {
		fmt.Println("Error retrieving cover for ID '"+id+"': ", err)
		cover = indexer.FallbackCover
	}

	bytes, err := os.ReadFile(cover.Directory)
	if err != nil {
		fmt.Println("Error retrieving cover file for ID '"+id+"'': ", err)
		cover = indexer.FallbackCover
	}

	// don't re-request for a day
	w.Header().Set("Cache-Control", "public, max-age=86400, immutable")

	w.Header().Set("Content-Type", cover.Mime)
	w.WriteHeader(http.StatusOK)

	w.Write(bytes)
}

func (ws *WebServer) artistColour(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	artist, ok := ws.indexer.Index.Artists[id]
	if !ok {
		http.Error(w, "Artist not found", http.StatusNotFound)
		return
	}

	cover, err := ws.indexer.GetCover(*artist.Albums[0].Tracks[0])
	if err != nil {
		fmt.Println("Error retrieving cover for ID '"+id+"': ", err)
		cover = indexer.FallbackCover
	}

	dominantColour, err := indexer.FindDominantColour(cover.Directory)
	if err != nil {
		http.Error(w, "Failed to extract dominant colour.", 500)
	}

	type DominantColourResponse struct {
		DominantColour string `json:"dominantColour"`
	}

	json.NewEncoder(w).Encode(DominantColourResponse{
		DominantColour: dominantColour,
	})
}
