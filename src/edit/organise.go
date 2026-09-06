package edit

import (
	"errors"
	"fmt"
	"musica-server/src/indexer"
	"os"
	"path/filepath"
	"strings"
)

func ReorganiseLibrary(indexer *indexer.Indexer) error {
	if indexer.Index.HasDuplicates {
		return errors.New("cannot reorganise library while there are duplicate named tracks.")
	}

	indexer.Index.Mutex.Lock()
	defer indexer.Index.Mutex.Unlock()

	for _, track := range indexer.Index.Tracks {
		artistDirUnsafe := track.AlbumArtist
		artistDir := strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(artistDirUnsafe, "/", "-"), "\\", "-"), ".", "-")

		albumDirUnsafe := track.Album
		albumDir := strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(albumDirUnsafe, "/", "-"), "\\", "-"), ".", "-")
		album := indexer.Index.Albums[track.AlbumId]

		if track.AlbumIsSingleName || len(album.Tracks) == 1 {
			albumDir = "."
		}

		categoryDir := "."

		newDir := filepath.Join(indexer.Index.Root, categoryDir, artistDir, albumDir)

		newFilenameUnsafe := track.Artist + " - " + track.Title
		newFilename := strings.ReplaceAll(strings.ReplaceAll(newFilenameUnsafe, "/", "-"), "\\", "-")

		newPath := filepath.Join(newDir, newFilename)

		err := os.MkdirAll(newDir, 0755)
		if err != nil {
			return fmt.Errorf("create required directory for track: %w", err)
		}

		err = moveTrackNoExtUnsafe(indexer, track, newPath)
		if err != nil {
			return fmt.Errorf("failed to move track "+track.Title+" by "+track.Artist+" to new directory: %w", err)
		}
	}

	return nil
}

// Source - https://stackoverflow.com/a/62529061
// Posted by maja
// Retrieved 2026-09-06, License - CC BY-SA 4.0

func pathIsChild(parent, sub string) (bool, error) {
	up := ".." + string(os.PathSeparator)

	// path-comparisons using filepath.Abs don't work reliably according to docs (no unique representation).
	rel, err := filepath.Rel(parent, sub)
	if err != nil {
		return false, err
	}
	if !strings.HasPrefix(rel, up) && rel != ".." {
		return true, nil
	}
	return false, nil
}

func moveTrackNoExt(indexer *indexer.Indexer, track *indexer.Track, newPath string) error {
	indexer.Index.Mutex.Lock()
	defer indexer.Index.Mutex.Unlock()

	return moveTrackNoExtUnsafe(indexer, track, newPath)
}

func moveTrackNoExtUnsafe(indexer *indexer.Indexer, track *indexer.Track, newPath string) error {
	isChild, err := pathIsChild(indexer.Index.Root, newPath)
	if err != nil {
		return fmt.Errorf("failed to retrieve relative newPath from library root: %w", err)
	}

	if !isChild {
		return errors.New("target path is outside of mediaLibrary, cannot move to here.")
	}

	ext := filepath.Ext(track.Path)
	realNewPath := newPath + ext

	bakFile := backupFileName(track)
	newBakFile := newPath + ".bak" + ext

	err = os.Rename(track.Path, realNewPath)
	if err != nil {
		return fmt.Errorf("failed to move track file: %w", err)
	}
	track.Path = realNewPath

	if _, err := os.Stat(bakFile); err == nil {
		// no error, backup file exists, so we should also move that

		err = os.Rename(bakFile, newBakFile)
		if err != nil {
			return fmt.Errorf("failed to move backup track file: %w", err)
		}
	}

	indexer.Index.Tracks[track.ID] = track

	return nil
}
