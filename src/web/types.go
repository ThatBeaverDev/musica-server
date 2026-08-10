package webServer

import (
	"musica-server/src/indexer"
	"musica-server/src/scores"
	"strconv"
)

type WebExportedTrack = struct {
	Title  string `json:"title"`
	Artist string `json:"artist"`

	Album         string `json:"album"`
	AlbumId       string `json:"albumId"`
	AlbumArtist   string `json:"albumArtist"`
	AlbumArtistId string `json:"albumArtistId"`

	Modified int64 `json:"modified"`
	Release  int   `json:"release"`
	Number   int   `json:"number"`

	ID string `json:"id"`

	Score  float64       `json:"score"`
	Subset scores.Subset `json:"subset"`
}

func (ws *WebServer) trackToWeb(track *indexer.Track) WebExportedTrack {
	score := ws.scores.TrackScore(track.ID)

	return WebExportedTrack{
		Title:  track.Title,
		Artist: track.Artist,

		Album:         track.Album,
		AlbumId:       track.AlbumId,
		AlbumArtist:   track.AlbumArtist,
		AlbumArtistId: track.AlbumArtistId,

		Modified: track.Modified,
		Release:  track.Release,
		Number:   track.Number,

		ID: track.ID,

		Score:  score,
		Subset: scores.GetScoreSubset(score),
	}
}

type WebExportedAlbum = struct {
	Title    string `json:"title"`
	Artist   string `json:"artist"`
	ArtistId string `json:"artistId"`
	ID       string `json:"id"`

	Modified int64               `json:"modified"`
	Release  int                 `json:"release"`
	Tracks   []*WebExportedTrack `json:"tracks"`

	Score float64 `json:"score"`
}

func (ws *WebServer) albumToWeb(album *indexer.Album) WebExportedAlbum {
	totalTrackScore := 0.0

	var tracks []*WebExportedTrack
	for _, track := range album.Tracks {
		webExported := ws.trackToWeb(track)
		tracks = append(tracks, &webExported)

		totalTrackScore += webExported.Score
	}

	totalTracks := float64(len(album.Tracks))
	albumScore := totalTrackScore / totalTracks

	return WebExportedAlbum{
		Title:    album.Title,
		Artist:   album.Artist,
		ArtistId: album.ArtistId,
		ID:       album.ID,

		Modified: album.Modified,
		Release:  album.Release,
		Tracks:   tracks,

		Score: albumScore,
	}
}

type WebExportedArtist struct {
	Name string `json:"name"`
	ID   string `json:"id"`

	Albums []*WebExportedAlbum `json:"albums"`

	Score float64 `json:"score"`

	Label string `json:"label,omitempty"`

	Formed int `json:"formed,omitempty"`
	Born   int `json:"born,omitempty"`
	Died   int `json:"died,omitempty"`

	Style string `json:"style,omitempty"`
	Genre string `json:"genre,omitempty"`
	Mood  string `json:"mood,omitempty"`

	Biography string `json:"biography,omitempty"`

	Country     string `json:"country,omitempty"`
	CountryCode string `json:"countryCode,omitempty"`

	Thumbnail string `json:"thumbnail,omitempty"`
	Logo      string `json:"logo,omitempty"`
}

func (ws *WebServer) artistToWeb(artist *indexer.Artist) WebExportedArtist {
	totalTrackScore := 0.0
	totalTracks := 0

	var albums []*WebExportedAlbum
	for _, album := range artist.Albums {
		webExported := ws.albumToWeb(album)
		albums = append(albums, &webExported)

		albumTracks := len(webExported.Tracks)

		// calculate total score of all tracks
		totalTrackScore += webExported.Score * float64(albumTracks)
		totalTracks += albumTracks
	}

	artistScore := totalTrackScore / float64(totalTracks)

	formed, err := strconv.Atoi(artist.Extra.Formed)
	if err != nil {
	} // it's fine, just use zero-value
	born, err := strconv.Atoi(artist.Extra.Born)
	if err != nil {
	} // it's fine, just use zero-value
	died, err := strconv.Atoi(artist.Extra.Died)
	if err != nil {
	} // it's fine, just use zero-value

	return WebExportedArtist{
		Name: artist.Name,
		ID:   artist.ID,

		Albums: albums,

		Score: artistScore,

		Label: artist.Extra.Label,

		Formed: formed,
		Born:   born,
		Died:   died,

		Style: artist.Extra.Style,
		Genre: artist.Extra.Genre,
		Mood:  artist.Extra.Mood,

		Biography: artist.Extra.Biography,

		Country:     artist.Extra.Country,
		CountryCode: artist.Extra.CountryCode,

		Thumbnail: artist.Extra.Thumbnail,
		Logo:      artist.Extra.Logo,
	}
}
