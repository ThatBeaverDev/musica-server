package scores

import (
	"errors"
	"math/rand/v2"
)

type Categories struct {
	All []string

	Top    []string
	Middle []string
	Bottom []string
}

func (scores *ScoreManager) categoriseTracks() *Categories {
	var topSet []string
	var middleSet []string
	var bottomSet []string
	var all []string

	for id, track := range scores.indexer.Index.Tracks {
		all = append(all, id)

		score := scores.TrackScore(track.ID)

		if score <= -25 {
			// none will match
			continue
		}

		if -25 < score && score <= -10 {
			bottomSet = append(bottomSet, id)
		} else if -10 < score && score <= 10 {
			middleSet = append(middleSet, id)
		} else if 10 < score && score <= 50 {
			topSet = append(topSet, id)
		}
	}

	categories := &Categories{
		All:    all,
		Top:    topSet,
		Middle: middleSet,
		Bottom: bottomSet,
	}

	return categories
}

type Subset string

// allowed subset values
const (
	SubsetStandard    Subset = "standard"
	SubsetExploration Subset = "exploration"
	SubsetWildcard    Subset = "wildcard"

	// fallback
	SubsetAny Subset = "any"
)

type RandomSubset struct {
	IDs    []string
	Subset Subset
}

func (scores *ScoreManager) ChooseRandomSubset() (RandomSubset, error) {
	point := rand.Float64() * 100

	categories := scores.categoriseTracks()
	var ids []string
	subset := SubsetAny

	if point < 2.5 {
		// 2.5% chance
		// tracks from -25pts to -10pts
		ids = categories.Bottom
		subset = SubsetWildcard
	} else if point < 10 {
		// 7.5% chance
		// tracks from -10pts to 20pts
		ids = categories.Middle
		subset = SubsetExploration
	} else {
		// 90% chance
		// tracks from 20pts to 50pts
		ids = categories.Top
		subset = SubsetStandard
	}

	if len(ids) > 0 {
		return RandomSubset{IDs: ids, Subset: subset}, nil
	}

	if len(categories.All) > 0 {
		return RandomSubset{IDs: categories.All, Subset: SubsetAny}, nil
	}

	return RandomSubset{}, errors.New("No tracks in library.")
}

type MixTrackChoice struct {
	ID     string
	Subset Subset
}

func (scores *ScoreManager) ChooseMixTrack() (MixTrackChoice, error) {
	randomSubset, err := scores.ChooseRandomSubset()
	if err != nil {
		return MixTrackChoice{}, err
	}

	tracks := randomSubset.IDs
	subset := randomSubset.Subset

	idx := rand.IntN(len(tracks))
	id := tracks[idx]

	return MixTrackChoice{ID: id, Subset: subset}, nil
}
