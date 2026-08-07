package Scores

import (
	"errors"
	"fmt"
	"math/rand/v2"
)

func scoreToWeight(score float64) float64 {
	// weights must be positive and over zero
	// Score +50 -> Weight 101.0
	// Score 0   -> Weight 51.0
	// Score -50 -> Weight 1.0
	weight := score + 51.0

	if weight < 1.0 {
		return 1.0
	}
	if weight > 101.0 {
		return 101.0
	}

	return weight
}

func (scores *ScoreManager) GetWeightedRandomTrack() (string, error) {
	scores.storeMutex.RLock()
	defer scores.storeMutex.RUnlock()

	if len(scores.indexer.Index.Tracks) == 0 {
		return "", errors.New("No tracks in library.")
	}

	// get total weight
	var totalWeight float64
	type trackWeight struct {
		id     string
		weight float64
	}

	trackList := make([]trackWeight, 0, len(scores.indexer.Index.Tracks))

	for id := range scores.indexer.Index.Tracks {
		// get score
		score := scores.trackScoreUnsafe(id)
		w := scoreToWeight(score)

		trackList = append(trackList, trackWeight{id: id, weight: w})
		totalWeight += w
	}

	if totalWeight <= 0 {
		return "", errors.New("invalid total weight")
	}

	// random number between 0 and total weight
	rnd := rand.Float64() * totalWeight

	// find track that random number fell on
	for _, tw := range trackList {
		rnd -= tw.weight
		if rnd <= 0 {
			return tw.id, nil
		}
	}

	// fallback for floating point issues
	return trackList[len(trackList)-1].id, nil
}

// old

func (scores *ScoreManager) ScoresInRange(low float64, high float64) []string {
	tracks := []string{}

	scores.storeMutex.RLock()
	for id := range scores.indexer.Index.Tracks {
		score := scores.trackScoreUnsafe(id)

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

	fmt.Println(tracks, idx, id, scores.indexer.Index.Tracks[id])

	return id, nil
}
