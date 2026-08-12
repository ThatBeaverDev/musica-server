package indexer

import (
	"musica-server/src/indexer"
	"musica-server/src/scores"
	webTypes "musica-server/src/types"
	"sort"
	"strings"

	"github.com/lithammer/fuzzysearch/fuzzy"
)

type SearchManager struct {
	indexer *indexer.Indexer
	scores  *scores.ScoreManager
}

type SearchResult struct {
	Tracks  []*webTypes.WebExportedTrack  `json:"tracks"`
	Albums  []*webTypes.WebExportedAlbum  `json:"albums"`
	Artists []*webTypes.WebExportedArtist `json:"artists"`
}

type rankedTrack struct {
	Track *webTypes.WebExportedTrack
	Rank  int
}

type rankedAlbum struct {
	Album *webTypes.WebExportedAlbum
	Rank  int
}

type rankedArtist struct {
	Artist *webTypes.WebExportedArtist
	Rank   int
}

func NewSearcher(indexer *indexer.Indexer, scores *scores.ScoreManager) *SearchManager {
	return &SearchManager{indexer: indexer, scores: scores}

}

func scoreTrack(query string, t *indexer.Track) int {
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

func scoreAlbum(query string, a *indexer.Album) int {
	best := -1

	type Field struct {
		value  string
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

func scoreArtist(query string, a *indexer.Artist) int {
	best := -1

	type Field struct {
		value  string
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

	s.indexer.Index.Mutex.RLock()
	defer s.indexer.Index.Mutex.RUnlock()

	var rankedTracks []rankedTrack
	var rankedAlbums []rankedAlbum
	var rankedArtists []rankedArtist

	for _, track := range s.indexer.Index.Tracks {
		if rank := scoreTrack(query, track); rank != -1 {
			rankedTracks = append(rankedTracks, rankedTrack{
				Track: webTypes.TrackToWeb(track, s.scores),
				Rank:  rank,
			})
		}
	}

	for _, album := range s.indexer.Index.Albums {
		if rank := scoreAlbum(query, album); rank != -1 {
			rankedAlbums = append(rankedAlbums, rankedAlbum{
				Album: webTypes.AlbumToWeb(album, s.scores),
				Rank:  rank,
			})
		}
	}

	for _, artist := range s.indexer.Index.Artists {
		if rank := scoreArtist(query, artist); rank != -1 {
			rankedArtists = append(rankedArtists, rankedArtist{
				Artist: webTypes.ArtistToWeb(artist, s.scores),
				Rank:   rank,
			})
		}
	}

	sort.Slice(rankedTracks, func(i, j int) bool {
		return rankedTracks[i].Track.Score > rankedTracks[j].Track.Score
	})
	sort.Slice(rankedTracks, func(i, j int) bool {
		return rankedTracks[i].Rank < rankedTracks[j].Rank
	})

	sort.Slice(rankedAlbums, func(i, j int) bool {
		return rankedAlbums[i].Album.Score > rankedAlbums[j].Album.Score
	})
	sort.Slice(rankedAlbums, func(i, j int) bool {
		return rankedAlbums[i].Rank < rankedAlbums[j].Rank
	})

	sort.Slice(rankedArtists, func(i, j int) bool {
		return rankedArtists[i].Artist.Score > rankedArtists[j].Artist.Score
	})
	sort.Slice(rankedArtists, func(i, j int) bool {
		return rankedArtists[i].Rank < rankedArtists[j].Rank
	})

	result := SearchResult{
		Tracks:  make([]*webTypes.WebExportedTrack, len(rankedTracks)),
		Albums:  make([]*webTypes.WebExportedAlbum, len(rankedAlbums)),
		Artists: make([]*webTypes.WebExportedArtist, len(rankedArtists)),
	}

	for i, track := range rankedTracks {
		result.Tracks[i] = track.Track
	}

	for i, album := range rankedAlbums {
		result.Albums[i] = album.Album
	}

	for i, artist := range rankedArtists {
		result.Artists[i] = artist.Artist
	}

	return result
}
