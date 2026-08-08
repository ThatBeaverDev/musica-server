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

func GetScoreSubset(score float64) Subset {
	if score <= -25 {
		// none will match
		return SubsetDislike
	}

	if -25 < score && score <= -10 {
		return SubsetWildcard
	} else if -10 < score && score <= 10 {
		return SubsetExploration
	} else if 10 < score && score <= 50 {
		return SubsetStandard
	}

	return SubsetOther
}

func (scores *ScoreManager) categoriseTracks() *Categories {
	var topSet []string
	var middleSet []string
	var bottomSet []string
	var all []string

	for id, track := range scores.indexer.Index.Tracks {
		score := scores.TrackScore(track.ID)

		subset := GetScoreSubset(score)

		switch subset {
		case SubsetDislike:
			continue // never serve

		case SubsetOther:
		// action, will add to `all`

		case SubsetWildcard:
			bottomSet = append(bottomSet, id)

		case SubsetExploration:
			middleSet = append(middleSet, id)

		case SubsetStandard:
			topSet = append(topSet, id)
		}

		all = append(all, id)
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
	SubsetDislike     Subset = "dislike"

	// fallback
	SubsetOther Subset = "other"
)

type RandomSubset struct {
	IDs    []string
	Subset Subset
}

func (scores *ScoreManager) ChooseRandomSubset() (RandomSubset, error) {
	point := rand.Float64() * 100

	categories := scores.categoriseTracks()
	var ids []string
	subset := SubsetOther

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
		return RandomSubset{IDs: categories.All, Subset: SubsetOther}, nil
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
