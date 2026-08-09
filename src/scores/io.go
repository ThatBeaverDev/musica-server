package scores

import (
	"encoding/json"
	"errors"
	"fmt"
	id "musica-server/src"
	"musica-server/src/indexer"
	shared "musica-server/src/sharedScores"
	"os"
	"path/filepath"
)

type scoreStorageV1 struct {
	Version int                  `json:"version"`
	Scores  shared.TrackScoreMap `json:"scores"`
}

// Map of oldHash -> newHash
func BuildLegacyToV1TranslationMap(indexer *indexer.Indexer) (map[string]string, error) {
	translationMap := make(map[string]string)

	for _, track := range indexer.Index.Tracks {
		cleanPath, err := filepath.Abs(filepath.ToSlash(filepath.Clean(track.Path)))
		if err != nil {
			return nil, err
		}

		oldID := fmt.Sprint(id.Hash(cleanPath))
		newID := fmt.Sprint(id.Hash(track.Title + "|" + track.Artist))

		translationMap[oldID] = newID
	}

	return translationMap, nil
}

// load legacy data
func parseLegacy(indexer *indexer.Indexer, jsonData []byte) (shared.TrackScoreMap, error) {
	idTranslationMap, err := BuildLegacyToV1TranslationMap(indexer)
	if err != nil {
		return nil, fmt.Errorf("Failed to build ID translation map: %w", err)
	}

	var scoresLegacyMap shared.TrackScoreMap
	if err := json.Unmarshal(jsonData, &scoresLegacyMap); err != nil {
		return nil, err
	}

	trackScores := make(shared.TrackScoreMap)
	for oldID, data := range scoresLegacyMap {
		newID, ok := idTranslationMap[oldID]
		if !ok {
			fmt.Println("ID " + oldID + " could not be translated in migration")
			continue
		}

		trackScores[newID] = data
	}

	return trackScores, nil
}

// load v1 data
func parseV1(jsonData []byte) (shared.TrackScoreMap, error) {
	var payload scoreStorageV1
	if err := json.Unmarshal(jsonData, &payload); err != nil {
		return nil, err
	}
	if payload.Version != 1 {
		return nil, errors.New("not version 1 storage format")
	}
	return payload.Scores, nil
}

func backup(newFile string) error {
	oldScores, err := os.ReadFile("./scores.json")
	if err != nil {
		return err
	}

	err = os.WriteFile(newFile, oldScores, 0644)
	if err != nil {
		return err
	}

	return nil
}

// load data from appropriate version
func readScoreMap(indexer *indexer.Indexer) (shared.TrackScoreMap, error) {
	jsonData, err := os.ReadFile("./scores.json")
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			// Doesn't exist, return a fresh map
			return make(shared.TrackScoreMap), nil
		}
		return nil, fmt.Errorf("failed to read scores file: %w", err)
	}

	// try V1
	if scores, err := parseV1(jsonData); err == nil {
		return scores, nil
	}

	err = backup("./scores-legacy-pre-migration.json")
	if err != nil {
		return nil, fmt.Errorf("failed to write pre-legacy migration file: %w", err)
	}

	scores, err := parseLegacy(indexer, jsonData)
	if err != nil {
		return nil, fmt.Errorf("failed to parse scores file (attempted V1 and legacy): %w", err)
	}

	return scores, nil
}

func (scores *ScoreManager) store() {
	scores.storeMutex.RLock()

	storageData := scoreStorageV1{Version: 1, Scores: scores.trackScores}
	jsonData, err := json.Marshal(storageData)

	scores.storeMutex.RUnlock()

	if err != nil {
		fmt.Println("Error marshaling JSON:", err)
		return
	}

	err = os.WriteFile("./scores.json", jsonData, 0644)
	if err != nil {
		fmt.Println("Error writing scores.json:", err)
		return
	}

	fmt.Println("Successfully saved to scores.json.")
}
