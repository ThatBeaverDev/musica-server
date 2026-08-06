package Scores

import (
	"encoding/json"
	"fmt"
	"math"
	"musica-server/src/indexer"
	"os"
	"sync"
	"time"
)

type trackScoreEntry struct {
	Score float64   `json:"score"`
	Date  time.Time `json:"date"`
}

type trackScoreMap map[string]trackScoreEntry

type ScoreManager struct {
	trackScores trackScoreMap // id to score

	storeMutex sync.RWMutex
}

func New() (*ScoreManager, error) {
	var trackScores trackScoreMap

	jsonString, err := os.ReadFile("./scores.json")
	if err != nil {
		trackScores = make(trackScoreMap)
	} else {
		// Unmarshal the JSON string to a map
		err = json.Unmarshal([]byte(jsonString), &trackScores)
		if err != nil {
			trackScores = make(trackScoreMap)
		}
	}

	scoreManager := &ScoreManager{
		trackScores: trackScores, // track to score (-50 to 50)
	}

	return scoreManager, nil
}

func (scores *ScoreManager) store() {
	jsonData, err := json.MarshalIndent(scores.trackScores, "", "    ")
	if err != nil {
		fmt.Println("Error marshaling JSON:", err)
		return
	}

	os.WriteFile("./scores.json", jsonData, 0644)

}

func (sm *ScoreManager) RecordEvent(trackID string, delta float64) {
	sm.storeMutex.Lock()
	defer sm.storeMutex.Unlock()

	data, exists := sm.trackScores[trackID]
	now := time.Now()

	if !exists {
		sm.trackScores[trackID] = trackScoreEntry{
			Score: delta,
			Date:  now,
		}
		return
	}

	// calculate decay
	daysElapsed := now.Sub(data.Date).Hours() / 24.0
	currentDecayed := data.Score * math.Exp(-decayLambda*daysElapsed)

	// add delta and clamp
	newScore := currentDecayed + delta
	if newScore > 50 {
		newScore = 50
	} else if newScore < -50 {
		newScore = -50
	}

	// store it
	data.Score = newScore
	data.Date = now

	// save on another thread
	go sm.store()
}

const decayLambda = 0.0077

func (scores *ScoreManager) trackScore(track *indexer.Track) float64 {
	scores.storeMutex.RLock()
	info, exists := scores.trackScores[track.ID]
	scores.storeMutex.RUnlock()

	if !exists {
		return 0
	}

	daysElapsed := time.Since(info.Date).Hours() / 24.0
	decayedScore := info.Score * math.Exp(-decayLambda*daysElapsed)

	return decayedScore
}

func (scores *ScoreManager) SpecificPlay(track *indexer.Track) {
	scores.RecordEvent(track.ID, 5)

}

func (scores *ScoreManager) Played(track *indexer.Track) {
	scores.RecordEvent(track.ID, 4)
}

func (scores *ScoreManager) Skipped(track *indexer.Track) {
	scores.RecordEvent(track.ID, -2)
}
