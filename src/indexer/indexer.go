package indexer

import (
	"fmt"
	"mime"
	identityStorage "musica-server/src"
	"musica-server/util"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"

	taglib "go.senan.xyz/taglib"
)

type Track struct {
	Title       string `json:"title"`
	Artist      string `json:"artist"`
	Album       string `json:"album"`
	AlbumArtist string `json:"albumArtist"`

	Release int `json:"release"`
	Number  int `json:"number"`

	Path string `json:"path"`
	ID   string `json:"id"`
}

type Album struct {
	Title  string `json:"title"`
	Artist string `json:"artist"`
	ID     string `json:"id"`

	Release int      `json:"release"`
	Tracks  []*Track `json:"tracks"`
}

type trackIndex struct {
	Root   string
	Tracks map[string]*Track
	Albums map[string]*Album
}

func GetTrackAlbumSpecifier(track Track) string {

	return fmt.Sprint(track.AlbumArtist, ":", track.Album)

}

type Indexer struct {
	Index *trackIndex

	dirToTrackMap          map[string]*Track
	trackToPictureStoreMap map[string]string // ID to MIME

	identityStorage  *identityStorage.IdentityStorage
	WorkingDirectory string
}

func New(directory string, idStorage *identityStorage.IdentityStorage) (Indexer, error) {
	workingDirectory, err := os.Getwd()
	if err != nil {
		return Indexer{}, fmt.Errorf("Failed to retrieve working directory: %w", err)
	}

	indexer := Indexer{
		Index: &trackIndex{
			Root:   directory,
			Tracks: make(map[string]*Track),
			Albums: make(map[string]*Album),
		},

		dirToTrackMap:          make(map[string]*Track),
		trackToPictureStoreMap: make(map[string]string), // ID to MIME

		WorkingDirectory: workingDirectory,
		identityStorage:  idStorage,
	}

	fmt.Println("Deleting media cache.")
	util.DeleteDirectory("./mediaCache")

	err = os.Mkdir("./mediaCache", 0700)
	if err != nil {
		return Indexer{}, fmt.Errorf("Failed to create ./mediaCache: %w", err)
	}
	fmt.Println("Media cache deleted.")

	err = indexer.walk(indexer.Index.Root)
	if err != nil {
		return Indexer{}, fmt.Errorf("Failed to walk IndexRoot: %w", err)
	}

	indexer.cleanupAlbums()

	return indexer, nil
}

func (s *Indexer) fileMetaData(directory string) (Track, error) {
	relative, err := filepath.Rel(s.WorkingDirectory, directory)
	if err != nil {
		return Track{}, fmt.Errorf("Failed to calculate relative path of file: %w", err)
	}

	id, err := s.identityStorage.TrackId(directory)
	if err != nil {
		return Track{}, fmt.Errorf("Failed to retrieve track ID: %w", err)
	}

	fmt.Println("Indexing file at", directory, "(id:", id, ")")

	tags, err := taglib.ReadTags(directory)
	if err != nil {
		return Track{}, fmt.Errorf("Failed to read file tags: %w", err)
	}

	// title
	trackTitle := tags[taglib.Title]
	fileName := strings.TrimSuffix(path.Base(directory), path.Ext(directory))
	var title string

	if len(trackTitle) > 0 {
		title = trackTitle[0]
	} else {
		title = fileName
	}

	// artist
	trackArtist := tags[taglib.Artist]
	var artist string

	if len(trackArtist) > 0 {
		artist = trackArtist[0]
	} else {
		artist = "Various Artists"
	}

	// album
	trackAlbum := tags[taglib.Album]
	var album string

	if len(trackAlbum) > 0 {
		album = trackAlbum[0]
	} else {
		album = title
	}

	// album artist
	trackAlbumArtist := tags[taglib.AlbumArtist]
	var albumArtist string

	if len(trackAlbumArtist) > 0 {
		albumArtist = trackAlbumArtist[0]
	} else {
		albumArtist = artist
	}

	// release
	trackReleaseStore := tags[taglib.Date]
	var releaseStore string

	if len(trackReleaseStore) > 0 {
		releaseStore = trackReleaseStore[0]
	} else {
		trackReleaseDate := tags[taglib.ReleaseDate]

		if len(trackReleaseDate) > 0 {
			releaseStore = trackReleaseDate[0]
		} else {
			releaseStore = ""
		}
	}

	var release int
	if releaseStore != "" {
		releaseTime, err := util.ParseYear(releaseStore)

		if err != nil {
			return Track{}, fmt.Errorf("Failed to parse year of track: %w", err)
		}

		release = int(releaseTime.Unix() * 1000)
	} else {
		release = 0
	}

	// number
	trackNumber := tags[taglib.TrackNumber]
	var number int

	if len(trackNumber) > 0 {
		var n int
		_, err := fmt.Sscanf(trackNumber[0], "%d", &n)

		if err != nil {
			//return Track{}, fmt.Errorf(fmt.Sprint("Failed to retrieve track number from '", trackNumber[0], "': %w"), err)
			number = 0
		} else {
			number = n
		}
	} else {
		number = 0
	}

	track := Track{
		Title:  title,
		Artist: artist,

		Album:       album,
		AlbumArtist: albumArtist,

		Release: release,
		Path:    relative,

		ID:     id,
		Number: number,
	}

	return track, nil
}

func (s *Indexer) indexTrack(directory string) error {
	t, err := s.fileMetaData(directory)
	if err != nil {
		return fmt.Errorf("Failed to retrieve File Metadata: %w", err)
	}

	track := t
	s.Index.Tracks[t.ID] = &t
	s.dirToTrackMap[directory] = &t

	albumSpecifier := GetTrackAlbumSpecifier(track)
	// insure the ID is prepared so things are consistent
	s.identityStorage.SpecifierToAlbumId(albumSpecifier)

	album, ok := s.Index.Albums[albumSpecifier]
	if ok {
		if album.Release == 0 && track.Release != 0 {
			album.Release = track.Release
		}

		album.Tracks = append(album.Tracks, &track)
	} else {
		s.Index.Albums[albumSpecifier] = &Album{
			Title:  track.Album,
			Artist: track.AlbumArtist,

			Release: track.Release,
			Tracks:  []*Track{&track},
			ID:      albumSpecifier,
		}
	}

	return nil
}

func albumHasTrack(slice []Track, target Track) bool {
	for _, track := range slice {
		if track.ID == target.ID {
			return true
		}
	}
	return false
}

func (s *Indexer) walk(dir string) error {
	contents, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("Failed to list directory: %w", err)
	}

	sort.Slice(contents, func(i, j int) bool {
		return contents[i].Name() < contents[j].Name()
	})

	for _, child := range contents {
		directory := path.Join(dir, child.Name())

		if child.IsDir() {
			err := s.walk(directory)

			if err != nil {
				return err
			}
		} else {
			mimeType := mime.TypeByExtension(path.Ext(directory))
			mimePreSlash := strings.Split(mimeType, "/")[0]
			if mimePreSlash != "audio" {
				continue
			}

			err := s.indexTrack(directory)

			if err != nil {
				return fmt.Errorf("Failed to index track: %w", err)
			}
		}
	}

	return nil
}

// deletes empty albums
func (s *Indexer) cleanupAlbums() {
	for albumId, album := range s.Index.Albums {
		if len(album.Tracks) == 0 {
			delete(s.Index.Albums, albumId)
		}

		if album.Title == "" || album.Artist == "" {
			delete(s.Index.Albums, albumId)
		}
	}
}

type CoverResult struct {
	Mime      string
	Directory string
}

func (s *Indexer) GetCover(track Track) (CoverResult, error) {
	artPath := path.Join(
		s.WorkingDirectory,
		"mediaCache",
		fmt.Sprint(track.ID, "_art"),
	)

	// cache hit
	if mime, ok := s.trackToPictureStoreMap[track.ID]; ok {
		return CoverResult{
			Mime:      mime,
			Directory: artPath,
		}, nil
	}

	// read image from audio file
	imgBytes, err := taglib.ReadImage(track.Path)
	if err != nil {
		return CoverResult{}, fmt.Errorf("Failed to load cover image: %w", err)
	}

	// fallback if no image exists
	if imgBytes == nil {
		imgBytes, err = os.ReadFile("./public/img/no-art.png")
		if err != nil {
			return CoverResult{}, fmt.Errorf("Failed to read fallback track art: %w", err)
		}

		// PNG fallback
		s.trackToPictureStoreMap[track.ID] = "image/png"

		err = os.WriteFile(artPath, imgBytes, 0644)
		if err != nil {
			return CoverResult{}, fmt.Errorf("Failed to write track art cache file (of fallback): %w", err)
		}

		return CoverResult{
			Mime:      "image/png",
			Directory: artPath,
		}, nil
	}

	// write raw image bytes directly (fast path)
	err = os.WriteFile(artPath, imgBytes, 0644)
	if err != nil {
		return CoverResult{}, fmt.Errorf("Failed to write track art cache file (of embedded): %w", err)
	}

	// store mime (best-effort detection via file header)
	mime := http.DetectContentType(imgBytes)
	s.trackToPictureStoreMap[track.ID] = mime

	return CoverResult{
		Mime:      mime,
		Directory: artPath,
	}, nil
}
