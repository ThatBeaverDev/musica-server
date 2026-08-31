package edit

import (
	"fmt"
	"musica-server/src/indexer"
	"musica-server/src/scores"

	"github.com/ThatBeaverDev/taggy"
)

func EditTrackTitle(indexer *indexer.Indexer, scoreManager *scores.ScoreManager, track *indexer.Track, newTitle string) error {
	newId, err := indexer.IdentityStorage.TrackId(newTitle, track.Artist)
	if err != nil {
		return fmt.Errorf("failed to generate new track ID: %w", err)
	}

	blank := []string{}
	err = taggy.TagFile(track.Path, []string{newTitle}, blank, blank, blank, blank, blank, "")
	if err != nil {
		return fmt.Errorf("failed to edit track tags: %w", err)
	}

	err = changeTrackId(indexer, scoreManager, track, newId)
	if err != nil {
		return fmt.Errorf("failed to change track ID: %w", err)
	}
	track.Title = newTitle
	if track.AlbumIsSingleName {
		track.Album = newTitle

		indexer.ReassignTrack(track, track.AlbumId)
	}

	return nil
}
