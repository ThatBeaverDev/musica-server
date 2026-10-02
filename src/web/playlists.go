package webServer

import (
	"encoding/json"
	"errors"
	"musica-server/src/indexer"
	"musica-server/src/playlists"
	webTypes "musica-server/src/types"
	"net/http"
	"os"

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
	list := ws.playlists.PlaylistIds()

	err := json.NewEncoder(w).Encode(list)
	if err != nil {
		ws.logger.Error("failed to encode JSON response: ", err.Error())
		http.Error(w, "failed to encode JSON response", http.StatusInternalServerError)
	}
}

func (ws *WebServer) playlistInfo(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	playlist, err := ws.playlists.PlaylistById(id)
	if err != nil {
		http.Error(w, "Playlist not found", http.StatusNotFound)
		return
	}

	webExported := webTypes.PlaylistToWeb(playlist, ws.indexer, ws.scores)
	err = json.NewEncoder(w).Encode(webExported)
	if err != nil {
		ws.logger.Error("failed to encode JSON response: ", err.Error())
		http.Error(w, "failed to encode JSON response", http.StatusInternalServerError)
	}
}

func (ws *WebServer) getPlaylistIconTrack(playlist *playlists.Playlist) (*indexer.Track, error) {
	track, ok := ws.indexer.Index.Tracks[playlist.PictureTrackId]
	if !ok {
		totalTracks := len(playlist.TrackIds)

		if totalTracks != 0 {
			playlist.PictureTrackId = playlist.TrackIds[0]
			return ws.getPlaylistIconTrack(playlist)
		}

		playlist.PictureTrackId = ""
		return nil, errors.New("Playlist has no tracks and therefore no art.")
	}

	return track, nil
}

func (ws *WebServer) bulkPlaylists(w http.ResponseWriter, r *http.Request) {
	playlistsHeader := r.Header.Get("playlists")
	if playlistsHeader == "" {
		http.Error(w, "Playlists to receive bulk properties for must be specified in the 'playlists' header.", http.StatusBadRequest)
		return
	}

	if len(playlistsHeader) > 20000 {
		http.Error(w, "Too many characters in `playlists` header", http.StatusBadRequest)
		return
	}

	var ids []string
	if err := json.Unmarshal([]byte(playlistsHeader), &ids); err != nil {
		http.Error(w, "Invalid playlists header: "+err.Error(), http.StatusBadRequest)
		return
	}

	result := []*webTypes.WebExportedPlaylist{}

	for _, id := range ids {
		if playlist, err := ws.playlists.PlaylistById(id); err == nil {
			webExported := webTypes.PlaylistToWeb(playlist, ws.indexer, ws.scores)
			result = append(result, webExported)
		}
	}

	err := json.NewEncoder(w).Encode(result)
	if err != nil {
		ws.logger.Error("failed to encode JSON response: ", err.Error())
		http.Error(w, "failed to encode JSON response", http.StatusInternalServerError)
	}
}

func (ws *WebServer) playlistArt(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	playlist, err := ws.playlists.PlaylistById(id)
	if err != nil {
		http.Error(w, "Playlist not found", http.StatusNotFound)
		return
	}

	track, err := ws.getPlaylistIconTrack(playlist)
	if err != nil {
		http.Error(w, "Playlist art not found", http.StatusInternalServerError)
		return
	}

	cover, err := ws.indexer.GetCover(*track)
	if err != nil {
		ws.logger.Error("Error retrieving cover for ID '"+id+"': ", err)
		cover = indexer.FallbackCover
	}

	bytes, err := os.ReadFile(cover.Directory)
	if err != nil {
		ws.logger.Error("Error retrieving cover file for ID '"+id+"'': ", err)
		cover = indexer.FallbackCover
	}

	// don't re-request for a day
	w.Header().Set("Cache-Control", "public, max-age=86400, immutable")

	w.Header().Set("Content-Type", cover.Mime)
	w.WriteHeader(http.StatusOK)

	w.Write(bytes)
}

func (ws *WebServer) playlistColour(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	playlist, err := ws.playlists.PlaylistById(id)
	if err != nil {
		http.Error(w, "Playlist not found", http.StatusNotFound)
		return
	}

	track, err := ws.getPlaylistIconTrack(playlist)
	if err != nil {
		http.Error(w, "Playlist art not found", http.StatusInternalServerError)
		return

	}

	cover, err := ws.indexer.GetCover(*track)
	if err != nil {
		ws.logger.Error("Error retrieving cover for ID '"+id+"': ", err)
		cover = indexer.FallbackCover
	}

	dominantColour, err := indexer.FindDominantColour(ws.logger, cover.Directory)
	if err != nil {
		http.Error(w, "Failed to extract dominant colour.", 500)
	}

	type DominantColourResponse struct {
		DominantColour string `json:"dominantColour"`
	}

	err = json.NewEncoder(w).Encode(DominantColourResponse{
		DominantColour: dominantColour,
	})
	if err != nil {
		ws.logger.Error("failed to encode JSON response: ", err.Error())
		http.Error(w, "failed to encode JSON response", http.StatusInternalServerError)
	}
}

func (ws *WebServer) deletePlaylist(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	_, err := ws.playlists.PlaylistById(id)
	if err != nil {
		http.Error(w, "Playlist not found", http.StatusNotFound)
		return
	}

	err = ws.playlists.DeletePlaylist(id)
	if err != nil {
		http.Error(w, "Failed to delete playlist", http.StatusInternalServerError)
		return
	}
}

func (ws *WebServer) setPlaylistItems(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	tracksHeader := r.Header.Get("tracks")
	if tracksHeader == "" {
		http.Error(w, "Tracks to set the playlist contents to must be specified 'tracks' header.", http.StatusBadRequest)
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
	for _, id := range ids {
		track, ok := ws.indexer.Index.Tracks[id]
		if ok {
			tracks = append(tracks, track)
		}
	}

	err := ws.playlists.SetPlaylistItems(id, tracks)
	if err != nil {
		http.Error(w, "Failed to set playlist tracks list: "+err.Error(), http.StatusInternalServerError)
	}
}
