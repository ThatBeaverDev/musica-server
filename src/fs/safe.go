package safe_fs

import (
	"fmt"
	"os"
	"path/filepath"
)

func SafeWriteFile(path string, contents []byte) (err error) {
	mode := os.FileMode(0600)
	if info, statErr := os.Stat(path); statErr == nil {
		mode = info.Mode().Perm()
	}

	dir := filepath.Dir(path)
	tmpFile, err := os.CreateTemp(dir, "safe-write-*.tmp")
	if err != nil {
		return fmt.Errorf("failed to create temp file: %w", err)
	}

	tmpName := tmpFile.Name()

	// cleanup if fails or panics
	defer func() {
		if err != nil {
			tmpFile.Close()
			os.Remove(tmpName)
		}
	}()

	if err = tmpFile.Chmod(mode); err != nil {
		return fmt.Errorf("failed to set temp file permissions: %w", err)
	}

	if _, err = tmpFile.Write(contents); err != nil {
		return fmt.Errorf("failed to write to temp file: %w", err)
	}

	// flush (force to write)
	if err = tmpFile.Sync(); err != nil {
		return fmt.Errorf("failed to sync temp file: %w", err)
	}

	if err = tmpFile.Close(); err != nil {
		return fmt.Errorf("failed to close temp file: %w", err)
	}

	if err = os.Rename(tmpName, path); err != nil {
		return fmt.Errorf("failed to rename temp file to target: %w", err)
	}

	return nil
}
