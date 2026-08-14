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

	result := []*webTypes.WebExportedAlbum{}

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

func (ws *WebServer) albumArt(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	album, ok := ws.indexer.Index.Albums[id]
	if !ok {
		http.Error(w, "Album not found", http.StatusNotFound)
		return
	}

	cover, err := ws.indexer.GetCover(*album.Tracks[0])
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

func (ws *WebServer) albumColour(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	album, ok := ws.indexer.Index.Albums[id]
	if !ok {
		http.Error(w, "Album not found", http.StatusNotFound)
		return
	}

	cover, err := ws.indexer.GetCover(*album.Tracks[0])
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
