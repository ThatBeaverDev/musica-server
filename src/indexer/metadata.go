package indexer

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	ids "musica-server/src"
	"musica-server/util"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"

	taglib "go.senan.xyz/taglib"
)

func (s *Indexer) fileMetaData(directory string) (Track, error) {
	relative, err := filepath.Rel(s.WorkingDirectory, directory)
	if err != nil {
		return Track{}, fmt.Errorf("Failed to calculate relative path of file: %w", err)
	}

	tags, err := taglib.ReadTags(directory)
	if err != nil {
		return Track{}, fmt.Errorf("Failed to read file tags: %w", err)
	}

	// title
	trackTitle := tags[taglib.Title]
	fileName := strings.TrimSuffix(path.Base(directory), path.Ext(directory))
	var title string

	if len(trackTitle) > 0 {
		title = trackTitle[0]
	} else {
		title = fileName
	}

	// artist
	trackArtist := tags[taglib.Artist]
	var artist string

	if len(trackArtist) > 0 {
		artist = trackArtist[0]
	} else {
		artist = "Various Artists"
	}

	id, err := s.identityStorage.TrackId(title, artist)
	if err != nil {
		return Track{}, fmt.Errorf("Failed to retrieve track ID: %w", err)
	}

	// album
	trackAlbum := tags[taglib.Album]
	var albumName string

	if len(trackAlbum) > 0 {
		albumName = trackAlbum[0]
	} else {
		albumName = title
	}

	// album artist
	trackAlbumArtist := tags[taglib.AlbumArtist]
	var albumArtist string

	if len(trackAlbumArtist) > 0 {
		albumArtist = trackAlbumArtist[0]
	} else {
		albumArtist = artist
	}

	// release
	trackReleaseStore := tags[taglib.Date]
	var releaseStore string

	if len(trackReleaseStore) > 0 {
		releaseStore = trackReleaseStore[0]
	} else {
		trackReleaseDate := tags[taglib.ReleaseDate]

		if len(trackReleaseDate) > 0 {
			releaseStore = trackReleaseDate[0]
		} else {
			releaseStore = ""
		}
	}

	var release int
	if releaseStore != "" {
		releaseTime, err := util.ParseYear(releaseStore)

		if err != nil {
			return Track{}, fmt.Errorf("Failed to parse year of track: %w", err)
		}

		release = int(releaseTime.UnixMilli())
	} else {
		release = 0
	}

	// number
	trackNumber := tags[taglib.TrackNumber]
	var number int

	if len(trackNumber) > 0 {
		var n int
		_, err := fmt.Sscanf(trackNumber[0], "%d", &n)

		if err != nil {
			//return Track{}, fmt.Errorf(fmt.Sprint("Failed to retrieve track number from '", trackNumber[0], "': %w"), err)
			number = 0
		} else {
			number = n
		}
	} else {
		number = 0
	}

	stats, err := os.Stat(directory)
	if err != nil {
		return Track{}, err
	}
	modified := stats.ModTime().UnixMilli()

	props, err := taglib.ReadProperties(directory)
	if err != nil {
		return Track{}, fmt.Errorf("Failed to read file properties: %w", err)
	}

	track := Track{
		Title:  title,
		Artist: artist,

		Album:         albumName,
		AlbumId:       "",
		AlbumArtist:   albumArtist,
		AlbumArtistId: "",

		Modified: modified,
		Release:  release,
		Path:     relative,
		Duration: props.Length,

		ID:     id,
		Number: number,
	}

	s.Index.mutex.Lock()
	defer s.Index.mutex.Unlock()

	// add to album
	albumSpecifier := GetAlbumSpecifierDirect(albumArtist, albumName)
	// insure the ID is prepared so things are consistent
	albumID := s.identityStorage.SpecifierToAlbumId(albumSpecifier)
	track.AlbumId = albumID

	album, ok := s.Index.Albums[albumID]
	if ok {
		if album.Release == 0 && track.Release != 0 {
			album.Release = track.Release
		}

		if track.Modified > album.Modified {
			album.Modified = track.Modified
		}

		album.Tracks = append(album.Tracks, &track)
		track.AlbumArtistId = album.ArtistId
	} else {
		album := &Album{
			Title:    track.Album,
			Artist:   track.AlbumArtist,
			ArtistId: "",

			Modified: track.Modified,
			Release:  track.Release,
			Tracks:   []*Track{&track},
			ID:       albumID,
		}

		s.Index.Albums[albumID] = album

		// add the new album to artist too
		artistSpecifier := GetAlbumArtistSpecifier(album)
		// insure the ID is prepared so things are consistent
		artistID := s.identityStorage.ASpecifierToArtistId(artistSpecifier)
		album.ArtistId = artistID
		track.AlbumArtistId = album.ArtistId

		artist, ok := s.Index.Artists[artistID]
		if ok {
			artist.Albums = append(artist.Albums, album)
		} else {
			extra, err := s.GetArtistExtraMetadata(album.Artist)
			if err != nil {
				fmt.Println("failure to retrieve artist extra metadata, bypassing:", err)
			}

			artist := &Artist{
				Name: album.Artist,

				ID:     artistID,
				Albums: []*Album{album},
				Extra:  extra,
			}

			s.Index.Artists[artistID] = artist
		}
	}

	return track, nil
}

type ExtraArtistMetadata struct {
	Name string `json:"strArtist,omitempty"`

	Label string `json:"label,omitempty"`

	Formed string `json:"intFormedYear,omitempty"`
	Born   string `json:"intBornYear,omitempty"`
	Died   string `json:"intDiedYear,omitempty"`

	Style string `json:"strStyle,omitempty"`
	Genre string `json:"strGenre,omitempty"`
	Mood  string `json:"strMood,omitempty"`

	Biography string `json:"strBiography,omitempty"`

	Country     string `json:"strCountry,omitempty"`
	CountryCode string `json:"strCountryCode,omitempty"`

	Thumbnail string `json:"strArtistThumb,omitempty"`
	Logo      string `json:"strArtistLogo,omitempty"`
}

func (s *Indexer) GetArtistExtraMetadata(name string) (*ExtraArtistMetadata, error) {
	dir := path.Join(s.cacheDirectory, fmt.Sprint(ids.Hash(name), "_extraMetadata.json"))

	var extra *ExtraArtistMetadata

	bytes, err := os.ReadFile(dir)
	existed := true
	if err == nil {
		// make it not nil
		extra = &ExtraArtistMetadata{}

		if err := json.Unmarshal(bytes, extra); err != nil {
			return nil, fmt.Errorf("Failed to unmarshal JSON from file: %w", err)
		}
	} else {
		if errors.Is(err, os.ErrNotExist) {
			existed = false
			// doesn't exist, request from 'the net'
			Url := "https://www.theaudiodb.com/api/v1/json/123/search.php?s=" + url.QueryEscape(name)

			resp, err := http.Get(Url)
			if err != nil {
				log.Fatalf("Failed to make request: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				return nil, fmt.Errorf("Unexpected status code: %d", resp.StatusCode)
			}

			responseBody, err := io.ReadAll(resp.Body)
			if err != nil {
				return nil, fmt.Errorf("Failed to read response body: %v", err)
			}

			type AudioDbResponse struct {
				Artists []*ExtraArtistMetadata `json:"artists"`
			}

			var fullResponse AudioDbResponse
			if err := json.Unmarshal(responseBody, &fullResponse); err != nil {
				return nil, err
			}

			if len(fullResponse.Artists) == 0 {
				// no data.
				extra = &ExtraArtistMetadata{}
			} else {
				extra = fullResponse.Artists[0]
			}

		} else {
			return nil, fmt.Errorf("Failed to read artist extra metadata file: %w", err)
		}
	}

	if !existed {
		jsonData, err := json.Marshal(extra)

		if err != nil {
			fmt.Println("Error marshaling JSON:", err)
		}

		err = os.WriteFile(dir, jsonData, 0644)
	}

	return extra, nil
}
