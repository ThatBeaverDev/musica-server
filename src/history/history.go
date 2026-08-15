package history

import (
	"fmt"
	"math"
	"musica-server/src/indexer"
	shared "musica-server/src/sharedScores"
	"sync"
	"time"
)

type ScoreEntryList []*shared.TrackScoreEntry
type PlayRecord map[string]int64

type TrackHistoryStore struct {
	Scores ScoreEntryList `json:"scores"`
	Plays  PlayRecord     `json:"plays"`

	Title  string `json:"title,omitempty"`
	Artist string `json:"artist,omitempty"`
	Album  string `json:"album,omitempty"`
}

type TrackHistoryMap map[string]TrackHistoryStore

type History struct {
	Tracks TrackHistoryMap `json:"t,omitempty"`
}

type HistoryManager struct {
	History *History
	indexer *indexer.Indexer

	mutex sync.RWMutex
}

func roundFloat(val float64, precision uint) float64 {
	ratio := math.Pow(10, float64(precision))
	return math.Round(val*ratio) / ratio
}

func New(indexer *indexer.Indexer) (*HistoryManager, error) {
	history, err := readHistory(indexer)
	if err != nil {
		return nil, fmt.Errorf("Failed to read history from history store: %w", err)
	}

	historyManager := &HistoryManager{
		History: &history,
		indexer: indexer,

		mutex: sync.RWMutex{},
	}

	go historyManager.store()

	return historyManager, nil
}

func (history *HistoryManager) OnUpdateScore(track *indexer.Track, oldScore float64, date time.Time) {
	fmt.Println("New score for " + track.ID + " of " + fmt.Sprintf("%f", oldScore) + ".")
	entryStore := &shared.TrackScoreEntry{Score: roundFloat(oldScore, 3), Date: date}

	trackEntry, ok := history.History.Tracks[track.ID]
	if !ok {
		// doesn't exist
		history.History.Tracks[track.ID] = TrackHistoryStore{
			Scores: ScoreEntryList{entryStore},
			Plays:  make(PlayRecord),
			Title:  track.Title,
			Artist: track.Artist,
			Album:  track.Album,
		}
	} else {
		trackEntry.Scores = append(trackEntry.Scores, entryStore)
	}

	go history.store()
}

func (history *HistoryManager) OnTrackPlay(track *indexer.Track) {
	now := time.Now()
	dateStr := now.Format("2006-01-02")

	plays := history.History.Tracks[track.ID].Plays

	data, ok := plays[dateStr]
	if !ok {
		plays[dateStr] = 1
	} else {
		plays[dateStr] = data + 1
	}

	go history.store()
}
