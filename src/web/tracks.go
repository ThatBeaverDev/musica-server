package webServer

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
)

func (ws *WebServer) listTracks(w http.ResponseWriter, r *http.Request) {
	var list []string

	for id := range ws.indexer.Index.Tracks {
		list = append(list, id)
	}

	json.NewEncoder(w).Encode(list)
}

func (ws *WebServer) trackInfo(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	track, ok := ws.indexer.Index.Tracks[id]
	if !ok {
		http.Error(w, "Track not found", 404)
		return
	}

	webExported := ws.trackToWeb(track)
	json.NewEncoder(w).Encode(webExported)
}

func (ws *WebServer) bulkTracks(w http.ResponseWriter, r *http.Request) {
	tracksHeader := r.Header.Get("tracks")
	if tracksHeader == "" {
		http.Error(w, "Tracks to receive bulk properties for must be specified in the 'tracks' header.", http.StatusBadRequest)
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

	var result []WebExportedTrack

	for _, id := range ids {
		if track, ok := ws.indexer.Index.Tracks[id]; ok {
			webExported := ws.trackToWeb(track)
			result = append(result, webExported)
		}
	}

	json.NewEncoder(w).Encode(result)
}

func (ws *WebServer) trackFile(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	track, ok := ws.indexer.Index.Tracks[id]
	if !ok {
		http.Error(w, "Track not found", 404)
		return
	}

	fullPath := filepath.Join(ws.indexer.WorkingDirectory, track.Path)

	file, err := os.Open(fullPath)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Track media file does not exist. Server may need to restart to update index.", 500)
		return
	}
	defer file.Close()

	stat, _ := file.Stat()

	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Content-Type", "audio/mpeg")

	http.ServeContent(w, r, stat.Name(), stat.ModTime(), file)
}

func (ws *WebServer) trackArt(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	track, ok := ws.indexer.Index.Tracks[id]
	if !ok {
		http.Error(w, "Track not found", 404)
		return
	}

	cover, err := ws.indexer.GetCover(*track)
	if err != nil {
		http.Error(w, "No art", 404)
		return
	}

	// don't re-request for a day
	w.Header().Set("Cache-Control", "public, max-age=86400, immutable")

	http.ServeFile(w, r, cover.Directory)
}

func (ws *WebServer) userSpecificPlay(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	track, ok := ws.indexer.Index.Tracks[id]
	if !ok {
		http.Error(w, "Track not found", 404)
		return
	}

	ws.scores.SpecificPlay(track)
}

func (ws *WebServer) trackPlayed(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	track, ok := ws.indexer.Index.Tracks[id]
	if !ok {
		http.Error(w, "Track not found", 404)
		return
	}

	ws.scores.Played(track)
}

func (ws *WebServer) trackSkipped(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	track, ok := ws.indexer.Index.Tracks[id]
	if !ok {
		http.Error(w, "Track not found", 404)
		return
	}

	ws.scores.Skipped(track)
}

func (ws *WebServer) randomMixTrack(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")

	type RandomMixTrackResponse = struct {
		ID string `json:"id"`
	}

	track, err := ws.scores.GetWeightedRandomTrack()
	if err != nil {
		http.Error(w, "No tracks in library.", 404)
		return
	}

	result := RandomMixTrackResponse{ID: track}

	json.NewEncoder(w).Encode(result)
}
