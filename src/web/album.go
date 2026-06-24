package webServer

import (
	"bytes"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (ws *WebServer) listAlbums(w http.ResponseWriter, r *http.Request) {
	var list []string

	for id := range ws.indexer.Index.Albums {
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

func (ws *WebServer) albumInfo(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	album, ok := ws.indexer.Index.Albums[id]
	if !ok {
		http.Error(w, "Album not found", 404)
		return
	}

	json.NewEncoder(w).Encode(album)
}

func (ws *WebServer) bulkAlbums(w http.ResponseWriter, r *http.Request) {
	albumHeader := r.Header.Get("albums")
	if albumHeader == "" {
		http.Error(w, "Albums to receive bulk properties for must be specified in the 'albums' header.", http.StatusBadRequest)
		return
	}

	var ids []string
	if err := json.Unmarshal([]byte(albumHeader), &ids); err != nil {
		http.Error(w, "Invalid albums header: "+err.Error(), http.StatusBadRequest)
		return
	}

	var result []any

	for _, id := range ids {
		if album, ok := ws.indexer.Index.Albums[id]; ok {
			result = append(result, album)
		} else {
			result = append(result, nil)
		}
	}

	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
