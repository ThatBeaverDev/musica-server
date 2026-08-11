package history

import (
	"encoding/json"
	"errors"
	"fmt"
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
func readHistory() (History, error) {
	jsonData, err := os.ReadFile("./history.json")
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

	storageData := historyStorageV1{Version: 1, History: history.History.Tracks}
	jsonData, err := json.Marshal(storageData)

	if err != nil {
		fmt.Println("Error marshaling JSON:", err)
		return
	}

	tmpFile, err := os.CreateTemp(".", "history-*.tmp")
	if err != nil {
		fmt.Println("Error creating temp file:", err)
		return
	}
	tmpName := tmpFile.Name()

	if _, err := tmpFile.Write(jsonData); err != nil {
		tmpFile.Close()
		os.Remove(tmpName)
		fmt.Println("Error writing to temp file:", err)
		return
	}
	tmpFile.Close()

	if err := os.Rename(tmpName, "./history.json"); err != nil {
		os.Remove(tmpName)
		fmt.Println("Error replacing history.json:", err)
		return
	}

	fmt.Println("Successfully saved to history.json.")
}
