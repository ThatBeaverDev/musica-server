package edit

import (
	"errors"
	"fmt"
	"musica-server/src/indexer"
	"musica-server/src/scores"
)

func changeTrackIdUnsafe(indexer *indexer.Indexer, scoreManager *scores.ScoreManager, track *indexer.Track, newId string) error {
	oldId := track.ID

	if _, ok := indexer.Index.Tracks[oldId]; !ok {
		return errors.New("no track by ID '" + oldId + "' exists.")
	}
	if _, ok := indexer.Index.Tracks[newId]; ok {
		return errors.New("track by ID '" + newId + "' already exists.")
	}

	err := scoreManager.ChangeTrackId(oldId, newId)
	if err != nil {
		return fmt.Errorf("failed to change score track ID: %w", err)
	}

	delete(indexer.Index.Tracks, oldId)
	indexer.Index.Tracks[newId] = track
	track.ID = newId

	if album, ok := indexer.Index.Albums[track.AlbumId]; ok {
		for idx, storedTrack := range album.Tracks {
			if storedTrack.ID == oldId {
				album.Tracks[idx] = track
				break
			}
		}
	}

	return nil
}

func changeAlbumId(indexer *indexer.Indexer, album *indexer.Album, newId string) error {
	indexer.Index.Mutex.Lock()
	defer indexer.Index.Mutex.Unlock()

	oldId := album.ID

	if _, ok := indexer.Index.Albums[oldId]; !ok {
		return errors.New("no album by ID '" + oldId + "' exists.")
	}
	if _, ok := indexer.Index.Albums[newId]; ok {
		return errors.New("album by ID '" + newId + "' already exists.")
	}

	delete(indexer.Index.Albums, oldId)
	indexer.Index.Albums[newId] = album
	album.ID = newId

	for _, track := range album.Tracks {
		track.AlbumId = newId
	}

	return nil
}
