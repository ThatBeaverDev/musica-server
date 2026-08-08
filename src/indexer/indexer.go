package indexer

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	"mime"
	identityStorage "musica-server/src"
	"musica-server/src/config"
	"musica-server/util"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"github.com/nfnt/resize"
	taglib "go.senan.xyz/taglib"
)

type Track struct {
	Title  string
	Artist string

	Album       string
	AlbumArtist string

	Modified int64
	Release  int
	Number   int

	Path string
	ID   string
}

func (t *Track) MarshalJSON() ([]byte, error) {
	return nil, errors.New("Track cannot be marshalled - It should be converted to a WebExportedTrack first.")
}

type Album struct {
	Title  string `json:"title"`
	Artist string `json:"artist"`
	ID     string `json:"id"`

	Modified int64    `json:"modified"`
	Release  int      `json:"release"`
	Tracks   []*Track `json:"tracks"`
}

func (a *Album) MarshalJSON() ([]byte, error) {
	return nil, errors.New("Album cannot be marshalled - It should be converted to a WebExportedAlbum first.")
}

type Artist struct {
	Name string `json:"name"`
	ID   string `json:"id"`

	Albums []*Album `json:"albums"`
}

func (a *Artist) MarshalJSON() ([]byte, error) {
	return nil, errors.New("Artist cannot be marshalled - It should be converted to a WebExportedArtist first.")
}

type trackIndex struct {
	Root    string
	Tracks  map[string]*Track
	Albums  map[string]*Album
	Artists map[string]*Artist

	mutex sync.RWMutex
}

func GetTrackAlbumSpecifier(track Track) string {
	return fmt.Sprint(track.AlbumArtist, ":", track.Album)
}

func GetAlbumArtistSpecifier(album *Album) string {
	return fmt.Sprint(album.Artist)
}

type Indexer struct {
	Index *trackIndex

	trackToPictureStoreMap map[string]string // ID to MIME
	mutex                  sync.RWMutex

	WorkingDirectory string

	identityStorage *identityStorage.IdentityStorage
	config          *config.Config
}

func New(directory string, idStorage *identityStorage.IdentityStorage, config *config.Config) (*Indexer, error) {
	workingDirectory, err := os.Getwd()
	if err != nil {
		return &Indexer{}, fmt.Errorf("Failed to retrieve working directory: %w", err)
	}

	indexer := Indexer{
		Index: &trackIndex{
			Root:    directory,
			Tracks:  make(map[string]*Track),
			Albums:  make(map[string]*Album),
			Artists: make(map[string]*Artist),

			mutex: sync.RWMutex{},
		},

		trackToPictureStoreMap: make(map[string]string), // ID to MIME

		WorkingDirectory: workingDirectory,

		identityStorage: idStorage,
		config:          config,
	}

	fmt.Println("Deleting media cache.")
	util.DeleteDirectory(config.MediaCache)

	err = os.Mkdir(config.MediaCache, 0700)
	if err != nil {
		return &Indexer{}, fmt.Errorf(fmt.Sprint("Failed to create '", config.MediaCache, "': %w"), err)
	}
	fmt.Println("Media cache deleted.")

	waitGroup := sync.WaitGroup{}
	err = indexer.walk(indexer.Index.Root, &waitGroup)
	if err != nil {
		return &Indexer{}, fmt.Errorf("Failed to walk IndexRoot: %w", err)
	}
	waitGroup.Wait()

	indexer.cleanupAlbums()
	indexer.cleanupArtists()

	return &indexer, nil
}

func (s *Indexer) fileMetaData(directory string) (Track, error) {
	relative, err := filepath.Rel(s.WorkingDirectory, directory)
	if err != nil {
		return Track{}, fmt.Errorf("Failed to calculate relative path of file: %w", err)
	}

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

	id, err := s.identityStorage.TrackId(title, artist)
	if err != nil {
		return Track{}, fmt.Errorf("Failed to retrieve track ID: %w", err)
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

		release = int(releaseTime.UnixMilli())
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

	stats, err := os.Stat(directory)
	if err != nil {
		return Track{}, err
	}
	modified := stats.ModTime().UnixMilli()

	track := Track{
		Title:  title,
		Artist: artist,

		Album:       album,
		AlbumArtist: albumArtist,

		Modified: modified,
		Release:  release,
		Path:     relative,

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

	// lock mutex
	s.Index.mutex.Lock()
	defer s.Index.mutex.Unlock()

	if _, ok := s.Index.Tracks[t.ID]; ok {
		// already exists
		return errors.New("Two tracks of the same ID are present (both are titled '" + t.Title + "' by '" + t.Artist + "')")
	}

	// write data
	s.Index.Tracks[t.ID] = &t

	// add to album
	albumSpecifier := GetTrackAlbumSpecifier(track)
	// insure the ID is prepared so things are consistent
	id := s.identityStorage.SpecifierToAlbumId(albumSpecifier)

	album, ok := s.Index.Albums[id]
	if ok {
		if album.Release == 0 && track.Release != 0 {
			album.Release = track.Release
		}

		if track.Modified > album.Modified {
			album.Modified = track.Modified
		}

		album.Tracks = append(album.Tracks, &track)
	} else {
		album := &Album{
			Title:  track.Album,
			Artist: track.AlbumArtist,

			Modified: track.Modified,
			Release:  track.Release,
			Tracks:   []*Track{&track},
			ID:       id,
		}

		s.Index.Albums[id] = album

		// add the new album to artist too
		artistSpecifier := GetAlbumArtistSpecifier(album)
		// insure the ID is prepared so things are consistent
		id := s.identityStorage.ASpecifierToArtistId(artistSpecifier)

		artist, ok := s.Index.Artists[id]
		if ok {
			artist.Albums = append(artist.Albums, album)
		} else {
			artist := &Artist{
				Name: album.Artist,

				ID:     id,
				Albums: []*Album{album},
			}

			s.Index.Artists[id] = artist
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

func (s *Indexer) walk(dir string, waitGroup *sync.WaitGroup) error {
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
			err := s.walk(directory, waitGroup)

			if err != nil {
				return err
			}
		} else {
			mimeType := mime.TypeByExtension(path.Ext(directory))
			mimePreSlash := strings.Split(mimeType, "/")[0]
			if mimePreSlash != "audio" {
				continue
			}

			waitGroup.Add(1)

			go func(path string) {
				defer waitGroup.Done()

				err := s.indexTrack(path)

				if err != nil {
					fmt.Println(fmt.Errorf("Failed to index track: %w", err))
				}
			}(directory)

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

		sort.Slice(album.Tracks, func(i, j int) bool {
			return album.Tracks[i].Number < album.Tracks[j].Number
		})
	}
}

// deletes empty artists
func (s *Indexer) cleanupArtists() {
	for artistId, artist := range s.Index.Artists {
		if len(artist.Albums) == 0 {
			delete(s.Index.Albums, artistId)
		}

		if artist.Name == "" {
			delete(s.Index.Artists, artistId)
		}
	}
}

type CoverResult struct {
	Mime      string
	Directory string
}

func processAndSaveImage(rawBytes []byte, destPath string, maxDimension uint) error {
	// decode into image.Image
	img, _, err := image.Decode(bytes.NewReader(rawBytes))
	if err != nil {
		return fmt.Errorf("failed to decode image: %w", err)
	}

	// resize
	resizedImg := resize.Thumbnail(maxDimension, maxDimension, img, resize.Lanczos3)

	// create cache file
	outFile, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("failed to create cache file: %w", err)
	}
	defer outFile.Close()

	// compress as JPEG
	opts := jpeg.Options{Quality: 80}
	if err := jpeg.Encode(outFile, resizedImg, &opts); err != nil {
		return fmt.Errorf("failed to encode image as JPEG: %w", err)
	}

	return nil
}

const fallbackArt = "./public/img/no-art.png"

var FallbackCover = CoverResult{Mime: "image/png", Directory: fallbackArt}

func (s *Indexer) GetCover(track Track) (CoverResult, error) {
	artPath := path.Join(
		s.WorkingDirectory,
		s.config.MediaCache,
		fmt.Sprint(track.ID, "_art"),
	)

	s.mutex.RLock()

	// cache hit
	if mime, ok := s.trackToPictureStoreMap[track.ID]; ok {
		s.mutex.RUnlock()
		return CoverResult{
			Mime:      mime,
			Directory: artPath,
		}, nil
	}
	s.mutex.RUnlock()

	// read image from audio file
	imgBytes, err := taglib.ReadImage(track.Path)
	if err != nil {
		fmt.Println("failed to laod cover image for ID '"+track.ID+"': %w", err)
		return FallbackCover, nil
	}

	// fallback if no image exists
	if imgBytes == nil {
		return FallbackCover, nil
	}

	// resize and write to disk
	err = processAndSaveImage(imgBytes, artPath, 350)
	if err != nil {
		fmt.Println("could not process/save image for ID '"+track.ID+"', using fallback: %w", err)

		return FallbackCover, nil
	}

	// store mime (best-effort detection via file header)
	mime := http.DetectContentType(imgBytes)
	s.mutex.Lock()
	s.trackToPictureStoreMap[track.ID] = mime
	s.mutex.Unlock()

	return CoverResult{
		Mime:      mime,
		Directory: artPath,
	}, nil
}
