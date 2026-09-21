package webServer

import (
	"encoding/json"
	"musica-server/src/indexer"
	webTypes "musica-server/src/types"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (ws *WebServer) newPlaylist(w http.ResponseWriter, r *http.Request) {
	title := r.Header.Get("playlist-title")
	if title == "" {
		ws.logger.Warn("malformed request to create playlist lacking 'playlist-title' header")
		http.Error(w, "'playlist-title' header must be set", http.StatusBadRequest)
		return
	}

	description := r.Header.Get("playlist-description")

	tracksHeader := r.Header.Get("playlist-tracks")
	if tracksHeader == "" {
		ws.logger.Warn("malformed request to create playlist lacking 'playlist-tracks' header")
		http.Error(w, "Tracks to add to playlist must be specified in the 'playlist-tracks' header.", http.StatusBadRequest)
		return
	}

	if len(tracksHeader) > 20000 {
		http.Error(w, "Too many characters in `tracks` header", http.StatusBadRequest)
		return
	}

	var ids []string
	if err := json.Unmarshal([]byte(tracksHeader), &ids); err != nil {
		http.Error(w, "Invalid tracks header: "+err.Error(), http.StatusBadRequest)
		return
	}

	var tracks []*indexer.Track
	ws.indexer.Index.Mutex.RLock()
	for _, id := range ids {
		track, ok := ws.indexer.Index.Tracks[id]
		if !ok {
			ws.logger.Warn("new playlist requests track by ID '" + id + "' be included but it does not exist. refusing.")
			http.Error(w, "Track by id '"+id+"' does not exist.", http.StatusNotFound)
			ws.indexer.Index.Mutex.RUnlock()
			return
		}

		tracks = append(tracks, track)
	}
	ws.indexer.Index.Mutex.RUnlock()

	ws.playlists.NewPlaylist(title, description, tracks)
}

func (ws *WebServer) listPlaylists(w http.ResponseWriter, r *http.Request) {
	var list []string

	for id := range ws.playlists.Playlists {
		list = append(list, id)
	}

	err := json.NewEncoder(w).Encode(list)
	if err != nil {
		ws.logger.Error("failed to encode JSON response: ", err.Error())
		http.Error(w, "failed to encode JSON response", http.StatusInternalServerError)
	}
}

func (ws *WebServer) playlistInfo(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	playlist, ok := ws.playlists.Playlists[id]
	if !ok {
		http.Error(w, "Playlist not found", http.StatusNotFound)
		return
	}

	webExported := webTypes.PlaylistToWeb(playlist, ws.indexer, ws.scores)
	err := json.NewEncoder(w).Encode(webExported)
	if err != nil {
		ws.logger.Error("failed to encode JSON response: ", err.Error())
		http.Error(w, "failed to encode JSON response", http.StatusInternalServerError)
	}
}
