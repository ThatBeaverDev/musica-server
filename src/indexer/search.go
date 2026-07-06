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
	Artists []*Artist `json:"artists"`
}

type rankedTrack struct {
	Track *Track
	Rank  int
}

type rankedAlbum struct {
	Album *Album
	Rank  int
}

type rankedArtist struct {
	Artist *Artist
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

	type Field struct {
		value string
		weight int
	}

	fields := []Field{
		{a.Title, 0},
		{a.Artist, 100},
	}

	// insure album for a track shows up
	for _, track := range a.Tracks {
		fields = append(fields, Field{value: track.Title, weight: 20})
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

func scoreArtist(query string, a *Artist) int {
	best := -1

	type Field struct {
		value string
		weight int
	}

	fields := []Field{
		{a.Name, 100},
	}

	// insure album for a track shows up
	for _, track := range a.Albums {
		fields = append(fields, Field{value: track.Title, weight: 20})
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
	var rankedArtists []rankedArtist

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
	
	for _, artist := range s.indexer.Index.Artists {
		if rank := scoreArtist(query, artist); rank != -1 {
			rankedArtists = append(rankedArtists, rankedArtist{
				Artist: artist,
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

	sort.Slice(rankedArtists, func(i, j int) bool {
		return rankedArtists[i].Rank < rankedArtists[j].Rank
	})

	result := SearchResult{
		Tracks: make([]*Track, len(rankedTracks)),
		Albums: make([]*Album, len(rankedAlbums)),
		Artists: make([]*Artist, len(rankedArtists)),
	}

	for i, t := range rankedTracks {
		result.Tracks[i] = t.Track
	}

	for i, a := range rankedAlbums {
		result.Albums[i] = a.Album
	}

	for i, a := range rankedArtists {
		result.Artists[i] = a.Artist
	}

	return result
}