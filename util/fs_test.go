package util_test

import (
	"musica-server/util"
	"os"
	"testing"
)

func TestDeleteDirectory(t *testing.T) {
	dir := "./test_delete_directory"

	os.Mkdir(dir, 0755)
	os.Mkdir(dir+"/subdir", 0755)
	os.Mkdir(dir+"/subdir/subdir2", 0755)
	os.Mkdir(dir+"/subdir1", 0755)

	os.WriteFile(dir+"/file.txt", []byte("Testing data"), 0644)
	os.WriteFile(dir+"/subdir/file.txt", []byte("Testing data"), 0644)
	os.WriteFile(dir+"/subdir/subdir2/file.txt", []byte("Testing data"), 0644)
	os.WriteFile(dir+"/file_2.txt", []byte("Testing data 2"), 0644)

	err := util.DeleteDirectory(dir)
	if err != nil {
		t.Errorf("util.DeleteDirectory() failed (you may want to clean up the directory at "+dir+"): %d", err)
	}
}
