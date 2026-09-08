package edit

import (
	"errors"
	"fmt"
	"io"
	"musica-server/src/indexer"
	"os"
	"path/filepath"
)

func backupFileName(track *indexer.Track) string {
	dirname := filepath.Dir(track.Path)
	filename := filepath.Base(track.Path)
	ext := filepath.Ext(track.Path)

	filenameNoExt := filename[:len(filename)-len(ext)]

	backupName := filepath.Join(dirname, filenameNoExt+".bak"+ext)
	return backupName
}

func backupFile(track *indexer.Track) error {
	backupFilepath := backupFileName(track)

	_, err := os.Stat(backupFilepath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			// continue
		} else {
			// oop
			return fmt.Errorf("failed to stat backup file in test for presence in backup: %w", err)
		}
	}

	err = os.Rename(track.Path, backupFilepath)
	if err != nil {
		return fmt.Errorf("failed to move to backup file: %w", err)
	}

	backupFile, err := os.Open(backupFilepath)
	if err != nil {
		return fmt.Errorf("failed to open backup file to copy back to track position: %w", err)
	}
	defer backupFile.Close()

	trackFile, err := os.Create(track.Path)
	if err != nil {
		return fmt.Errorf("failed to create standard file: %w", err)
	}
	defer trackFile.Close()

	_, err = io.Copy(trackFile, backupFile)
	if err != nil {
		return fmt.Errorf("failed to copy file to destination (backup exists at "+backupFilepath+", don't worry): %w", err)
	}

	return nil
}
