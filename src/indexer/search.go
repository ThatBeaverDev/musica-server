package indexer

import (
	"sort"
	"strings"

	"github.com/lithammer/fuzzysearch/fuzzy"
)

type SearchManager struct {
	indexer *Indexer
}

type SearchResult struct {
	Tracks []*Track `json:"tracks"`
	Albums []*Album `json:"albums"`
}

type rankedTrack struct {
	Track *Track
	Rank  int
}

type rankedAlbum struct {
	Album *Album
	Rank  int
}

func NewSearcher(indexer *Indexer) *SearchManager {
	return &SearchManager{indexer: indexer}
}

func scoreTrack(query string, t *Track) int {
	best := -1

	fields := []struct {
		value  string
		weight int
	}{
		{t.Title, 0},
		{t.Artist, 100},
		{t.Album, 200},
		{t.AlbumArtist, 300},
	}

	for _, field := range fields {
		if field.value == "" {
			continue
		}

		rank := fuzzy.RankMatchNormalizedFold(query, field.value)
		if rank == -1 {
			continue
		}

		rank += field.weight

		if best == -1 || rank < best {
			best = rank
		}
	}

	return best
}

func scoreAlbum(query string, a *Album) int {
	best := -1

	fields := []struct {
		value  string
		weight int
	}{
		{a.Title, 0},
		{a.Artist, 100},
	}

	for _, field := range fields {
		if field.value == "" {
			continue
		}

		rank := fuzzy.RankMatchNormalizedFold(query, field.value)
		if rank == -1 {
			continue
		}

		rank += field.weight

		if best == -1 || rank < best {
			best = rank
		}
	}

	return best
}

const maxQueryLen = 256

func (s *SearchManager) Query(query string) SearchResult {
	query = strings.TrimSpace(query)
	if query == "" {
		return SearchResult{}
	}
	if len(query) > maxQueryLen {
		query = query[:maxQueryLen]
	}
	
	query = strings.TrimSpace(query)
	if query == "" {
		return SearchResult{}
	}

	s.indexer.Index.mutex.RLock()
	defer s.indexer.Index.mutex.RUnlock()

	var rankedTracks []rankedTrack
	var rankedAlbums []rankedAlbum

	for _, track := range s.indexer.Index.Tracks {
		if rank := scoreTrack(query, track); rank != -1 {
			rankedTracks = append(rankedTracks, rankedTrack{
				Track: track,
				Rank:  rank,
			})
		}
	}

	for _, album := range s.indexer.Index.Albums {
		if rank := scoreAlbum(query, album); rank != -1 {
			rankedAlbums = append(rankedAlbums, rankedAlbum{
				Album: album,
				Rank:  rank,
			})
		}
	}

	sort.Slice(rankedTracks, func(i, j int) bool {
		return rankedTracks[i].Rank < rankedTracks[j].Rank
	})

	sort.Slice(rankedAlbums, func(i, j int) bool {
		return rankedAlbums[i].Rank < rankedAlbums[j].Rank
	})

	result := SearchResult{
		Tracks: make([]*Track, len(rankedTracks)),
		Albums: make([]*Album, len(rankedAlbums)),
	}

	for i, t := range rankedTracks {
		result.Tracks[i] = t.Track
	}

	for i, a := range rankedAlbums {
		result.Albums[i] = a.Album
	}

	return result
}