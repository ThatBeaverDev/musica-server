package safe_fs

import (
	"fmt"
	"os"
	"path/filepath"
)

func DeleteEmptySubdirectories(directory string) error {
	contents, err := os.ReadDir(directory)
	if err != nil {
		return fmt.Errorf("failed to read contents of directory '"+directory+"': %w", err)
	}

	if len(contents) == 0 {
		err = os.Remove(directory)
		if err != nil {
			return fmt.Errorf("failed to delete empty directory '"+directory+"': %w", err)
		}
	} else {
		for _, child := range contents {
			path := filepath.Join(directory, child.Name())
			fileType := child.Type()

			if fileType.IsDir() {
				err = DeleteEmptySubdirectories(path)
				if err != nil {
					return err
				}
			}
		}
	}

	return nil
}
