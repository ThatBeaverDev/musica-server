package Scores

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"math/rand/v2"
	"musica-server/src/indexer"
	"os"
	"sync"
	"time"
)

type trackScoreEntry struct {
	Score float64   `json:"score"`
	Date  time.Time `json:"date"`
}

type trackScoreMap map[string]*trackScoreEntry

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

	go scoreManager.store()

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

func (scores *ScoreManager) DeltaScore(track *indexer.Track, delta float64) {
	fmt.Println(track.Title, "( by", track.Artist, ") delta by", delta)

	scores.storeMutex.Lock()
	defer scores.storeMutex.Unlock()

	data, exists := scores.trackScores[track.ID]
	now := time.Now()

	if !exists {
		scores.trackScores[track.ID] = &trackScoreEntry{
			Score: delta,
			Date:  now,
		}

		go scores.store()

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
	go scores.store()
}

const decayLambda = 0.0077

func (scores *ScoreManager) trackScore(trackID string) float64 {
	scores.storeMutex.RLock()
	info, exists := scores.trackScores[trackID]
	scores.storeMutex.RUnlock()

	if !exists {
		return 0
	}

	daysElapsed := time.Since(info.Date).Hours() / 24.0
	decayedScore := info.Score * math.Exp(-decayLambda*daysElapsed)

	return decayedScore
}

func (scores *ScoreManager) ScoresInRange(low float64, high float64) []string {
	tracks := []string{}

	scores.storeMutex.RLock()
	for id := range scores.trackScores {
		score := scores.trackScore(id)

		if score >= low && score <= high {

			tracks = append(tracks, id)
		}
	}
	scores.storeMutex.RUnlock()

	return tracks
}

func (scores *ScoreManager) GetRandomSubset() ([]string, error) {
	point := rand.Float64() * 100

	var ids []string

	if point < 2.5 {
		// 2.5% chance
		// tracks from -25pts to -10pts
		ids = scores.ScoresInRange(-25, -10)
	} else if point < 10 {
		// 7.5% chance
		// tracks from -10pts to 10pts
		ids = scores.ScoresInRange(-10, 10)
	} else {
		// 90% chance
		// tracks from 10pts to 50pts
		ids = scores.ScoresInRange(10, 1000)
	}

	if len(ids) > 0 {
		return ids, nil
	}

	all := scores.ScoresInRange(-1000, 1000)
	if len(all) > 0 {
		return all, nil
	}

	return []string{}, errors.New("No tracks in library.")
}

func (scores *ScoreManager) ChooseMixTrack() (string, error) {
	tracks, err := scores.GetRandomSubset()
	if err != nil {
		return "", err
	}

	idx := rand.IntN(len(tracks))
	id := tracks[idx]

	return id, nil
}

func (scores *ScoreManager) SpecificPlay(track *indexer.Track) {
	scores.DeltaScore(track, 5)

}

func (scores *ScoreManager) Played(track *indexer.Track) {
	scores.DeltaScore(track, 4)
}

func (scores *ScoreManager) Skipped(track *indexer.Track) {
	scores.DeltaScore(track, -2)
}
