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

	storageData := historyStorageV1{Version: 1, History: history.History.Tracks}
	jsonData, err := json.Marshal(storageData)

	history.mutex.RUnlock()

	if err != nil {
		fmt.Println("Error marshaling JSON:", err)
		return
	}

	err = os.WriteFile("./history.json", jsonData, 0644)
	if err != nil {
		fmt.Println("Error writing history.json:", err)
		return
	}

	fmt.Println("Successfully saved to history.json.")
}
