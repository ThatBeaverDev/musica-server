package history

import (
	"encoding/json"
	"errors"
	"fmt"
	safeFS "musica-server/src/fs"
	"musica-server/src/indexer"
	"os"
)

type historyStorageV1 struct {
	Version int             `json:"version"`
	History TrackHistoryMap `json:"history"`
}

// load v1 data
func parseV1(jsonData []byte) (TrackHistoryMap, error) {
	var payload historyStorageV1
	if err := json.Unmarshal(jsonData, &payload); err != nil {
		return nil, err
	}
	if payload.Version != 1 {
		return nil, errors.New("not version 1 storage format")
	}
	return payload.History, nil
}

// load data from appropriate version
func readHistory(indexer *indexer.Indexer) (History, error) {

	jsonData, err := os.ReadFile(indexer.Config.HistoryFile)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			// Doesn't exist, return a fresh map
			return History{Tracks: make(TrackHistoryMap)}, nil
		}
		return History{}, fmt.Errorf("failed to read scores file: %w", err)
	}

	// try V1
	if history, err := parseV1(jsonData); err == nil {
		return History{Tracks: history}, nil
	}

	return History{}, errors.New("No version matched contents")
}

func (history *HistoryManager) store() {
	history.mutex.RLock()
	defer history.mutex.RUnlock()

	history.storeUnsafe()
}

func (history *HistoryManager) storeUnsafe() {
	storageData := historyStorageV1{Version: 1, History: history.History.Tracks}
	jsonData, err := json.Marshal(storageData)

	if err != nil {
		fmt.Println("Error marshaling JSON:", err)
		return
	}

	historyFile := history.indexer.Config.HistoryFile
	err = safeFS.SafeWriteFile(historyFile, jsonData)
	if err != nil {
		fmt.Println(fmt.Errorf("failed to write to "+historyFile+": %w", err))
	}

	fmt.Println("Successfully saved to " + historyFile + ".")
}
