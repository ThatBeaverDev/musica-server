package webServer

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (ws *WebServer) listAlbums(w http.ResponseWriter, r *http.Request) {
	var list []string

	for id := range ws.indexer.Index.Albums {
		specifier := ws.identityStorage.SpecifierToAlbumId(id)

		list = append(list, specifier)
	}

	json.NewEncoder(w).Encode(list)
}

func (ws *WebServer) albumInfo(w http.ResponseWriter, r *http.Request) {
	id, err := ws.identityStorage.AlbumIdToSpecifier(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Failed to retrieve specifier for ID "+id+": "+err.Error(), 404)
		return
	}

	album, ok := ws.indexer.Index.Albums[id]
	if !ok {
		http.Error(w, "Album not found", 404)
		return
	}

	album.ID = ws.identityStorage.SpecifierToAlbumId(album.ID)

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

	for _, webID := range ids {
		id, err := ws.identityStorage.AlbumIdToSpecifier(webID)
		if err != nil {
			http.Error(w, "Failed to retrieve specifier for ID "+webID+": "+err.Error(), http.StatusNotFound)
			return
		}

		if album, ok := ws.indexer.Index.Albums[id]; ok {
			album.ID = ws.identityStorage.SpecifierToAlbumId(album.ID)

			result = append(result, album)
		} else {
			result = append(result, nil)
		}
	}

	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
