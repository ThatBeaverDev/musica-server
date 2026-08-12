package indexer

import "sort"

// deletes empty albums
func (s *Indexer) cleanupAlbums() {
	for albumId, album := range s.Index.Albums {
		if len(album.Tracks) == 0 {
			delete(s.Index.Albums, albumId)
		}

		if album.Title == "" || album.Artist == "" {
			delete(s.Index.Albums, albumId)
		}

		sort.Slice(album.Tracks, func(i, j int) bool {
			return album.Tracks[i].Title < album.Tracks[j].Title
		})
		sort.Slice(album.Tracks, func(i, j int) bool {
			return album.Tracks[i].Number < album.Tracks[j].Number
		})
	}
}

// deletes empty artists
func (s *Indexer) cleanupArtists() {
	for artistId, artist := range s.Index.Artists {
		if len(artist.Albums) == 0 {
			delete(s.Index.Albums, artistId)
		}

		if artist.Name == "" {
			delete(s.Index.Artists, artistId)
		}

		sort.Slice(artist.Albums, func(i, j int) bool {
			return artist.Albums[i].Title < artist.Albums[j].Title
		})
		sort.Slice(artist.Albums, func(i, j int) bool {
			return int64(artist.Albums[i].Release) < int64(artist.Albums[j].Release)
		})
	}
}
