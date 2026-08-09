package sharedScoringTypes

import "time"

type TrackScoreEntry struct {
	Score float64   `json:"score"`
	Date  time.Time `json:"date"`
}

type TrackScoreMap map[string]*TrackScoreEntry
