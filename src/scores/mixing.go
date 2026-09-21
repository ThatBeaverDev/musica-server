package scores

import (
	"errors"
	"maps"
	"math/rand/v2"
	"musica-server/src/indexer"
	"musica-server/src/playlists"
	"slices"
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

func (scores *ScoreManager) categoriseTracks(playlist *playlists.Playlist) *Categories {
	var topSet []string
	var middleSet []string
	var bottomSet []string
	var all []string

	var tracks []*indexer.Track
	if playlist == nil {
		tracks = slices.Collect(maps.Values(scores.indexer.Index.Tracks))
	} else {
		for _, id := range playlist.TrackIds {
			track, ok := scores.indexer.Index.Tracks[id]
			if ok {
				tracks = append(tracks, track)
			}

		}
	}

	for _, track := range tracks {
		score := scores.TrackScore(track.ID)

		subset := GetScoreSubset(score)

		switch subset {
		case SubsetDislike:
			continue // never serve

		case SubsetOther:
		// action, will add to `all`

		case SubsetWildcard:
			bottomSet = append(bottomSet, track.ID)

		case SubsetExploration:
			middleSet = append(middleSet, track.ID)

		case SubsetStandard:
			topSet = append(topSet, track.ID)
		}

		all = append(all, track.ID)
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

func (scores *ScoreManager) ChooseRandomSubset(playlist *playlists.Playlist) (RandomSubset, error) {
	point := rand.Float64() * 100

	categories := scores.categoriseTracks(playlist)
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

func (scores *ScoreManager) ChooseMixTrack(playlist *playlists.Playlist) (MixTrackChoice, error) {
	randomSubset, err := scores.ChooseRandomSubset(playlist)
	if err != nil {
		return MixTrackChoice{}, err
	}

	tracks := randomSubset.IDs
	subset := randomSubset.Subset

	idx := rand.IntN(len(tracks))
	id := tracks[idx]

	return MixTrackChoice{ID: id, Subset: subset}, nil
}
