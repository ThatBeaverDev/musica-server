package webServer

import (
	"bytes"
	"encoding/json"
	"net/http"

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

	webExported := ws.artistToWeb(artist)

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

	var result []WebExportedArtist

	for _, id := range ids {
		if artist, ok := ws.indexer.Index.Artists[id]; ok {
			webExported := ws.artistToWeb(artist)

			result = append(result, webExported)
		}
	}

	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
