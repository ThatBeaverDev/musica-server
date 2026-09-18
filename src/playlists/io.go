package playlists

import (
	"encoding/json"
	"errors"
	"fmt"
	safeFS "musica-server/src/fs"
	"musica-server/src/indexer"
	"os"
)

type playlistStorageV1 struct {
	Version   int         `json:"version"`
	Playlists PlaylistMap `json:"playlists"`
}

// load v1 data
func parseV1(jsonData []byte) (PlaylistMap, error) {
	var payload playlistStorageV1
	if err := json.Unmarshal(jsonData, &payload); err != nil {
		return nil, err
	}
	if payload.Version != 1 {
		return nil, errors.New("not version 1 storage format")
	}
	return payload.Playlists, nil
}

type playlistData struct {
	Playlists map[int64]Playlist
}

// load data from appropriate version
func readPlaylists(indexer *indexer.Indexer) (PlaylistMap, error) {
	jsonData, err := os.ReadFile(indexer.Config.PlaylistsFile)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			// Doesn't exist, return a fresh map
			indexer.Logger.Log("Creating blank playlists store.")
			return make(PlaylistMap), nil
		}
		return make(PlaylistMap), fmt.Errorf("failed to read scores file: %w", err)
	}

	// try V1
	if playlists, err := parseV1(jsonData); err == nil {
		return playlists, nil
	}

	return make(PlaylistMap), errors.New("No version matched contents")
}

func (p *PlaylistManager) store() {
	p.mutex.RLock()
	defer p.mutex.RUnlock()

	p.storeUnsafe()
}

func (p *PlaylistManager) storeUnsafe() {
	storageData := playlistStorageV1{Version: 1, Playlists: p.Playlists}
	jsonData, err := json.Marshal(storageData)

	if err != nil {
		p.logger.Error("Error marshaling JSON:", err)
		return
	}

	playlistFile := p.indexer.Config.PlaylistsFile
	err = safeFS.SafeWriteFile(playlistFile, jsonData)
	if err != nil {
		p.logger.Error(fmt.Errorf("failed to write to "+playlistFile+": %w", err))
	}

	p.logger.Log("Successfully saved to " + playlistFile + ".")
}
