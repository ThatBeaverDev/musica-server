package webServer

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

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

	json.NewEncoder(w).Encode(track)
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
		http.Error(w, err.Error(), 500)
		return
	}
	defer file.Close()

	stat, _ := file.Stat()
	size := stat.Size()

	rangeHeader := r.Header.Get("Range")

	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Content-Type", "audio/mpeg")

	if rangeHeader == "" {
		w.Header().Set("Content-Length", fmt.Sprint(size))
		io.Copy(w, file)
		return
	}

	// parse range: bytes=start-end
	parts := strings.Split(strings.Replace(rangeHeader, "bytes=", "", 1), "-")

	start, _ := strconv.ParseInt(parts[0], 10, 64)
	end := size - 1

	if len(parts) > 1 && parts[1] != "" {
		e, _ := strconv.ParseInt(parts[1], 10, 64)
		end = e
	}

	chunkSize := end - start + 1

	w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, size))
	w.Header().Set("Content-Length", fmt.Sprint(chunkSize))
	w.WriteHeader(206)

	file.Seek(start, 0)
	io.CopyN(w, file, chunkSize)
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

	file, err := os.Open(cover.Directory)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer file.Close()

	w.Header().Set("Content-Type", cover.Mime)
	io.Copy(w, file)
}

func (ws *WebServer) bulkTracks(w http.ResponseWriter, r *http.Request) {
	var ids []string

	json.NewDecoder(r.Body).Decode(&ids)

	var result []any

	for _, id := range ids {
		if t, ok := ws.indexer.Index.Tracks[id]; ok {
			result = append(result, t)
		} else {
			result = append(result, nil)
		}
	}

	json.NewEncoder(w).Encode(result)
}
