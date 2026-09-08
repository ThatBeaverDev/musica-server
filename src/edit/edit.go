package edit

import (
	"errors"
	"fmt"
	"musica-server/src/indexer"
	"musica-server/src/scores"
	"strconv"

	"github.com/ThatBeaverDev/taggy"
)

var blank = []string{}

func EditTrackTitle(indexer *indexer.Indexer, scoreManager *scores.ScoreManager, track *indexer.Track, newTitle string) error {
	newId, err := indexer.IdentityStorage.TrackId(newTitle, track.Artist)
	if err != nil {
		return fmt.Errorf("failed to generate new track ID: %w", err)
	}

	err = backupFile(track)
	if err != nil {
		return fmt.Errorf("failed to create backup of track before mutation: %w", err)
	}

	err = taggy.TagFile(track.Path, []string{newTitle}, blank, blank, blank, blank, blank, "")
	if err != nil {
		return fmt.Errorf("failed to edit track tags: %w", err)
	}

	indexer.Index.Mutex.Lock()
	defer indexer.Index.Mutex.Unlock()

	err = changeTrackIdUnsafe(indexer, scoreManager, track, newId)
	if err != nil {
		return fmt.Errorf("failed to change track ID: %w", err)
	}
	track.Title = newTitle
	if track.AlbumIsSingleName {
		track.Album = newTitle

		indexer.ReassignTrackUnsafe(track, track.AlbumId)
	}

	return nil
}

func EditTrackAlbum(indexer *indexer.Indexer, track *indexer.Track, newAlbum string) error {
	err := backupFile(track)
	if err != nil {
		return fmt.Errorf("failed to create backup of track before mutation: %w", err)
	}

	err = taggy.TagFile(track.Path, blank, []string{newAlbum}, blank, blank, blank, blank, "")
	if err != nil {
		return fmt.Errorf("failed to edit track tags: %w", err)
	}

	track.Album = newAlbum

	indexer.ReassignTrack(track, track.AlbumId)

	return nil
}

func EditTrackArtist(track *indexer.Track, newArtist string) error {
	err := backupFile(track)
	if err != nil {
		return fmt.Errorf("failed to create backup of track before mutation: %w", err)
	}

	err = taggy.TagFile(track.Path, blank, blank, []string{newArtist}, blank, blank, blank, "")
	if err != nil {
		return fmt.Errorf("failed to edit track tags: %w", err)
	}

	track.Artist = newArtist

	return nil
}

func EditTrackAlbumArtist(indexer *indexer.Indexer, track *indexer.Track, newAlbumArtist string) error {
	err := backupFile(track)
	if err != nil {
		return fmt.Errorf("failed to create backup of track before mutation: %w", err)
	}

	err = taggy.TagFile(track.Path, blank, blank, blank, []string{newAlbumArtist}, blank, blank, "")
	if err != nil {
		return fmt.Errorf("failed to edit track tags: %w", err)
	}

	track.AlbumArtist = newAlbumArtist

	indexer.ReassignTrack(track, track.AlbumId)

	return nil
}

func EditTrackNumber(track *indexer.Track, newNumber int) error {
	err := backupFile(track)
	if err != nil {
		return fmt.Errorf("failed to create backup of track before mutation: %w", err)
	}

	err = taggy.TagFile(track.Path, blank, blank, blank, blank, []string{strconv.Itoa(newNumber)}, blank, "")
	if err != nil {
		return fmt.Errorf("failed to edit track tags: %w", err)
	}

	track.Number = newNumber

	return nil
}

type MetadataEditRequest struct {
	Title       string `json:"title"`
	Album       string `json:"album"`
	Artist      string `json:"artist"`
	AlbumArtist string `json:"albumArtist"`
	Number      int    `json:"number"`
	DiscNumber  int    `json:"discNumber"`
}

func BulkEditTrackMetadata(indexer *indexer.Indexer, scoreManager *scores.ScoreManager, track *indexer.Track, metadata MetadataEditRequest) error {
	var titles, albums, artists, albumArtists, numbers, discNumbers []string

	if metadata.Title != "" {
		titles = []string{metadata.Title}
	}
	if metadata.Album != "" {
		albums = []string{metadata.Album}
	}
	if metadata.Artist != "" {
		artists = []string{metadata.Artist}
	}
	if metadata.AlbumArtist != "" {
		albumArtists = []string{metadata.AlbumArtist}
	}
	if metadata.Number != 0 {
		numbers = []string{strconv.Itoa(metadata.Number)}
	}
	if metadata.DiscNumber != 0 {
		discNumbers = []string{strconv.Itoa(metadata.DiscNumber)}
	}

	err := backupFile(track)
	if err != nil {
		return fmt.Errorf("failed to create backup of track before mutation: %w", err)
	}

	err = taggy.TagFile(track.Path, titles, albums, artists, albumArtists, numbers, discNumbers, "")
	if err != nil {
		return fmt.Errorf("failed to edit track tags: %w", err)
	}

	titleChanged := metadata.Title != "" && metadata.Title != track.Title
	artistChanged := metadata.Artist != "" && metadata.Artist != track.Artist

	indexer.Index.Mutex.Lock()
	defer indexer.Index.Mutex.Unlock()

	if titleChanged || artistChanged {
		newId, err := indexer.IdentityStorage.TrackId(metadata.Title, track.Artist)
		if err != nil {
			return fmt.Errorf("failed to generate new track ID: %w", err)
		}

		err = changeTrackIdUnsafe(indexer, scoreManager, track, newId)
		if err != nil {
			return fmt.Errorf("failed to change track ID: %w", err)
		}

		if titleChanged {
			track.Title = metadata.Title

			if track.AlbumIsSingleName {
				track.Album = metadata.Title
			}
		} else if artistChanged {
			track.Artist = metadata.Artist
		}
	}

	if metadata.Album != "" {
		track.Album = metadata.Album
	}
	if metadata.AlbumArtist != "" {
		track.AlbumArtist = metadata.AlbumArtist
	}
	if metadata.Number > 0 {
		track.Number = metadata.Number
	}

	if metadata.Album != "" || metadata.AlbumArtist != "" || (titleChanged && track.AlbumIsSingleName) {
		indexer.ReassignTrackUnsafe(track, track.AlbumId)
	}

	return nil
}

func ChangeTrackArt(indexer *indexer.Indexer, track *indexer.Track, coverFile string) error {
	indexer.Index.Mutex.RLock()
	defer indexer.Index.Mutex.RUnlock()

	if _, ok := indexer.Index.Tracks[track.ID]; !ok {
		return errors.New("no track by ID '" + track.ID + "' exists.")
	}

	if coverFile == "" {
		return errors.New("cover path must be specified, not a zero-value, as this is a no-op.")
	}

	err := backupFile(track)
	if err != nil {
		return fmt.Errorf("failed to create backup of track before mutation: %w", err)
	}

	err = taggy.TagFile(track.Path, blank, blank, blank, blank, blank, blank, coverFile)
	if err != nil {
		return fmt.Errorf("failed to edit track tags: %w", err)
	}

	err = indexer.OnTrackArtChange(track)
	if err != nil {
		return fmt.Errorf("failed to mark track art change by cache clearing: %w", err)
	}

	return nil
}
