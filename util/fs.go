package util

import (
	"fmt"
	"os"
	"path"
)

func DeleteDirectory(dir string) error {
	contents, err := os.ReadDir(dir)

	if err != nil {
		return fmt.Errorf("Failed to list contents of directory: %w", err)
	}

	for _, child := range contents {
		directory := path.Join(dir, child.Name())

		if child.IsDir() {
			err := DeleteDirectory(directory)

			if err != nil {
				return err
			}
		} else {
			err := os.Remove(directory)
			if err != nil {
				return fmt.Errorf("Delete file: %w", err)
			}
		}
	}

	err = os.Remove(dir)
	if err != nil {
		return fmt.Errorf("Delete folder: %w", err)
	}

	return nil
}
