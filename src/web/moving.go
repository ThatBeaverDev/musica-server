package webServer

import (
	"encoding/json"
	"fmt"
	"io"
	"musica-server/src/edit"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"

	_ "image/jpeg"
	_ "image/png"

	_ "golang.org/x/image/bmp"
	_ "golang.org/x/image/tiff"
	_ "golang.org/x/image/webp"
)

type changeTrackResult struct {
	Ok bool `json:"ok"`
}

func (ws *WebServer) editTrackMetadata(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	ws.indexer.Index.Mutex.RLock()
	track, ok := ws.indexer.Index.Tracks[id]
	if !ok {
		http.Error(w, "Track not found", 404)
		return
	}
	ws.indexer.Index.Mutex.RUnlock()

	var editRequest edit.MetadataEditRequest

	err := json.NewDecoder(r.Body).Decode(&editRequest)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := edit.BulkEditTrackMetadata(ws.indexer, ws.scores, track, editRequest); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	defer func() {
		io.Copy(io.Discard, r.Body)
		r.Body.Close()
	}()

	json.NewEncoder(w).Encode(changeTrackResult{Ok: true})
}

const maxArtworkSize = 10 << 20 // 10 MiB
func (ws *WebServer) editTrackArt(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	ws.indexer.Index.Mutex.RLock()
	track, ok := ws.indexer.Index.Tracks[id]
	if !ok {
		http.Error(w, "Track not found", http.StatusNotFound)
		return
	}
	ws.indexer.Index.Mutex.RUnlock()

	r.Body = http.MaxBytesReader(w, r.Body, maxArtworkSize)

	tmp, err := os.CreateTemp("", "artwork-upload-*")
	if err != nil {
		http.Error(w, "could not create temporary file", http.StatusInternalServerError)
		return
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)
	defer tmp.Close()

	byteCount, err := io.Copy(tmp, r.Body)
	if err != nil {
		http.Error(w, "invalid or oversized image", http.StatusRequestEntityTooLarge)
		return
	}

	if byteCount == 0 {
		http.Error(w, "empty request body", http.StatusBadRequest)
		return
	}

	if err := tmp.Close(); err != nil {
		http.Error(w, "failed to save temporary file", http.StatusInternalServerError)
		return
	}

	err = edit.ChangeTrackArt(ws.indexer, track, tmp.Name())
	if err != nil {
		fmt.Println("failed to change track art", err)
		http.Error(w, "failed to change track art", http.StatusInternalServerError)
	}

	json.NewEncoder(w).Encode(changeTrackResult{Ok: true})
}
