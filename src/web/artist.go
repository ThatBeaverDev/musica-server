package webServer

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"musica-server/src/indexer"
	webTypes "musica-server/src/types"
	"net/http"
	"os"
	"path"

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

	webExported := webTypes.ArtistToWeb(artist, ws.scores)

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

	var result []*webTypes.WebExportedArtist

	for _, id := range ids {
		if artist, ok := ws.indexer.Index.Artists[id]; ok {
			webExported := webTypes.ArtistToWeb(artist, ws.scores)

			result = append(result, webExported)
		}
	}

	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func requestArtistArt(artist *webTypes.WebExportedArtist) ([]byte, error) {
	Url := artist.Thumbnail

	resp, err := http.Get(Url)
	if err != nil {
		return nil, fmt.Errorf("Failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Unexpected status code: %d", resp.StatusCode)
	}

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("Failed to read response body: %v", err)
	}

	return responseBody, nil
}

func (ws *WebServer) artistArt(artist *webTypes.WebExportedArtist) ([]byte, error) {
	dir := path.Join(ws.indexer.CacheDirectory, fmt.Sprint(artist.ID, "_artist_art"))

	var imageBytes []byte

	bytes, err := os.ReadFile(dir)
	existed := true
	if err == nil {
		// make it not nil
		imageBytes = bytes
	} else {
		if errors.Is(err, os.ErrNotExist) {
			existed = false
			// doesn't exist, request from 'the net'

			response, err := requestArtistArt(artist)
			if err != nil {
				return nil, fmt.Errorf("failed to retrieve artist art from external source: %w", err)
			}

			imageBytes = response
		} else {
			return nil, fmt.Errorf("Failed to read artist art cache file: %w", err)
		}
	}

	if !existed {
		err = os.WriteFile(dir, imageBytes, 0644)
	}

	return imageBytes, nil
}

func (ws *WebServer) artistAlbumFallbackArtBytes(id string) ([]byte, error) {
	artist, ok := ws.indexer.Index.Artists[id]
	if !ok {
		return []byte{}, errors.New("No artist by ID '" + id + "' exists.")
	}

	cover, err := ws.indexer.GetCover(*artist.Albums[0].Tracks[0])
	if err != nil {
		fmt.Println("Error retrieving cover for ID '"+id+"': ", err)
		cover = indexer.FallbackCover
	}

	bytes, err := os.ReadFile(cover.Directory)
	if err != nil {
		fmt.Println("Error retrieving cover file for ID '"+id+"'': ", err)
		cover = indexer.FallbackCover
	}

	return bytes, nil
}

func (ws *WebServer) artistArtEndpoint(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	artist, ok := ws.indexer.Index.Artists[id]
	if !ok {
		http.Error(w, "Artist not found", http.StatusNotFound)
		return
	}

	webexported := webTypes.ArtistToWeb(artist, ws.scores)

	var bytes []byte
	var err error

	if webexported.Thumbnail == "" {
		bytes, err = ws.artistAlbumFallbackArtBytes(artist.ID)
		if err != nil {
			http.Error(w, "Error retrieving fallback album cover file for artistID '"+id+"'': "+err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		bytes, err = ws.artistArt(webexported)
		if err != nil {
			http.Error(w, "Error retrieving cover file for ID '"+id+"'': "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// don't re-request for a day
	w.Header().Set("Cache-Control", "public, max-age=86400, immutable")

	w.WriteHeader(http.StatusOK)

	w.Write(bytes)
}

func (ws *WebServer) artistColour(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	artist, ok := ws.indexer.Index.Artists[id]
	if !ok {
		http.Error(w, "Artist not found", http.StatusNotFound)
		return
	}

	webexported := webTypes.ArtistToWeb(artist, ws.scores)

	var dir string
	var err error

	if webexported.Thumbnail == "" {
		_, err = ws.artistAlbumFallbackArtBytes(artist.ID)
		if err != nil {
			http.Error(w, "Error retrieving fallback album cover file for artistID '"+id+"'': "+err.Error(), http.StatusInternalServerError)
			return
		}
		dir = path.Join(
			ws.indexer.CacheDirectory,
			fmt.Sprint("track_", artist.Albums[0].Tracks[0].ID, "_art"),
		)
	} else {
		_, err = ws.artistArt(webexported)
		if err != nil {
			http.Error(w, "Error retrieving cover file for ID '"+id+"'': "+err.Error(), http.StatusInternalServerError)
			return
		}
		dir = path.Join(ws.indexer.CacheDirectory, fmt.Sprint(artist.ID, "_artist_art"))
	}

	dominantColour, err := indexer.FindDominantColour(dir)
	if err != nil {
		http.Error(w, "Failed to extract dominant colour.", http.StatusInternalServerError)
	}

	type DominantColourResponse struct {
		DominantColour string `json:"dominantColour"`
	}

	json.NewEncoder(w).Encode(DominantColourResponse{
		DominantColour: dominantColour,
	})
}
