package edit

import (
	"errors"
	"fmt"
	"io"
	"musica-server/src/indexer"
	"musica-server/src/logging"
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

func createTempBackup(logger *logging.Logger, track *indexer.Track) (_ *os.File, err error) {
	trackParentDirectory := filepath.Dir(track.Path)

	tmp, err := os.CreateTemp(trackParentDirectory, "temp-backup-*.tmp")
	if err != nil {
		return nil, fmt.Errorf("failed to open track file to copy to temp file: %w", err)
	}

	tempFileName := tmp.Name()
	logger.Debug("Temporary backup of " + track.Title + " by " + track.Artist + " created at " + tempFileName)

	defer (func() {
		if err != nil {
			tmp.Close()
			os.Remove(tempFileName)
		}
	})()

	trackFile, err := os.Open(track.Path)
	if err != nil {
		return nil, fmt.Errorf("failed to create temp backup file: %w", err)
	}
	defer trackFile.Close()

	_, err = io.Copy(tmp, trackFile)
	if err != nil {
		return nil, fmt.Errorf("failed to copy file to tempfile: %w", err)
	}

	return tmp, nil
}

func restoreTempBackup(logger *logging.Logger, track *indexer.Track, tmp *os.File) error {
	if _, err := tmp.Seek(0, io.SeekStart); err != nil {
		return fmt.Errorf("failed to seek temp file to start: %w", err)
	}
	logger.Debug("Temporary backup of " + track.Title + " by " + track.Artist + " restored from " + tmp.Name())

	trackFile, err := os.Create(track.Path)
	if err != nil {
		return fmt.Errorf("failed to create open track file: %w", err)
	}
	defer trackFile.Close()

	_, err = io.Copy(trackFile, tmp)
	if err != nil {
		return fmt.Errorf("failed to copy temp file back to main file in restore: %w", err)
	}

	return nil
}
