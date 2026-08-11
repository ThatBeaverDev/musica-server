package webServer

import (
	"bytes"
	"encoding/json"
	webTypes "musica-server/src/types"
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

	webExported := webTypes.AlbumToWeb(album, ws.scores)
	json.NewEncoder(w).Encode(webExported)
}

func (ws *WebServer) bulkAlbums(w http.ResponseWriter, r *http.Request) {
	albumsHeader := r.Header.Get("albums")
	if albumsHeader == "" {
		http.Error(w, "Albums to receive bulk properties for must be specified in the 'albums' header.", http.StatusBadRequest)
		return
	}

	if len(albumsHeader) > 20000 {
		http.Error(w, "Too many characters in `albums` header", http.StatusBadRequest)
		return
	}

	var ids []string
	if err := json.Unmarshal([]byte(albumsHeader), &ids); err != nil {
		http.Error(w, "Invalid albums header: "+err.Error(), http.StatusBadRequest)
		return
	}

	var result []*webTypes.WebExportedAlbum

	for _, id := range ids {
		if album, ok := ws.indexer.Index.Albums[id]; ok {
			webExported := webTypes.AlbumToWeb(album, ws.scores)
			result = append(result, webExported)
		}
	}

	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
