package scores

import (
	"fmt"
	"math"
	"musica-server/src/config"
	"musica-server/src/history"
	"musica-server/src/indexer"
	shared "musica-server/src/sharedScores"
	"sync"
	"time"
)

type ScoreManager struct {
	history *history.HistoryManager
	config  *config.Config

	trackScores shared.TrackScoreMap // id to score

	storeMutex sync.RWMutex
	indexer    *indexer.Indexer
}

func New(indexer *indexer.Indexer) (*ScoreManager, error) {
	trackScores, err := readScoreMap(indexer)
	if err != nil {
		return nil, fmt.Errorf("Failed to read score map: %w", err)
	}

	history, err := history.New(indexer)
	if err != nil {
		return nil, fmt.Errorf("failed to create history manager: %w", err)
	}

	scoreManager := &ScoreManager{
		history:     history,
		config:      indexer.Config,
		trackScores: trackScores, // track to score (-50 to 50)
		indexer:     indexer,
	}

	go scoreManager.store()

	return scoreManager, nil
}

func (scores *ScoreManager) DeltaScore(track *indexer.Track, delta float64) {
	fmt.Println(track.Title, "( by", track.Artist, ") delta by", delta)

	scores.storeMutex.Lock()
	defer scores.storeMutex.Unlock()

	data, exists := scores.trackScores[track.ID]
	now := time.Now()

	if !exists {
		scores.trackScores[track.ID] = &shared.TrackScoreEntry{
			Score: delta,
			Date:  now,
		}

		go scores.store()

		return
	}

	scores.history.OnUpdateScore(track, data.Score, data.Date)

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

func (scores *ScoreManager) trackScoreUnsafe(trackID string) float64 {

	info, exists := scores.trackScores[trackID]

	if !exists {
		return 0
	}

	daysElapsed := time.Since(info.Date).Hours() / 24.0
	decayedScore := info.Score * math.Exp(-decayLambda*daysElapsed)

	return decayedScore
}

func (scores *ScoreManager) TrackScore(trackID string) float64 {
	scores.storeMutex.RLock()
	defer scores.storeMutex.RUnlock()

	return scores.trackScoreUnsafe(trackID)
}

func (scores *ScoreManager) SpecificPlay(track *indexer.Track) {
	scores.DeltaScore(track, 5)
}

func (scores *ScoreManager) Played(track *indexer.Track) {
	scores.DeltaScore(track, 4)
	scores.history.OnTrackPlay(track)
}

func (scores *ScoreManager) Skipped(track *indexer.Track) {
	scores.DeltaScore(track, -2)
}
