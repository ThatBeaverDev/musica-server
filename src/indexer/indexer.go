package indexer

import (
	"errors"
	"fmt"
	"mime"
	identityStorage "musica-server/src"
	"musica-server/src/config"
	"os"
	"path"
	"sort"
	"strings"
	"sync"
	"time"
)

type Track struct {
	Title  string
	Artist string

	Album         string
	AlbumId       string
	AlbumArtist   string
	AlbumArtistId string

	Modified int64
	Release  int
	Number   int
	Duration time.Duration

	Path string
	ID   string
}

func (t *Track) MarshalJSON() ([]byte, error) {
	return nil, errors.New("Track cannot be marshalled - It should be converted to a WebExportedTrack first.")
}

type Album struct {
	Title    string
	Artist   string
	ArtistId string
	ID       string

	Modified int64
	Release  int
	Tracks   []*Track
}

func (a *Album) MarshalJSON() ([]byte, error) {
	return nil, errors.New("Album cannot be marshalled - It should be converted to a WebExportedAlbum first.")
}

type Artist struct {
	Name string
	ID   string

	Albums []*Album

	Extra *ExtraArtistMetadata
}

func (a *Artist) MarshalJSON() ([]byte, error) {
	return nil, errors.New("Artist cannot be marshalled - It should be converted to a WebExportedArtist first.")
}

type trackIndex struct {
	Root    string
	Tracks  map[string]*Track
	Albums  map[string]*Album
	Artists map[string]*Artist

	Mutex sync.RWMutex
}

func GetTrackAlbumSpecifier(track Track) string {
	return fmt.Sprint(track.AlbumArtist, ":", track.Album)
}

func GetAlbumSpecifierDirect(albumArtist string, album string) string {
	return fmt.Sprint(albumArtist, ":", album)
}

func GetAlbumArtistSpecifier(album *Album) string {
	return fmt.Sprint(album.Artist)
}

type Indexer struct {
	Index *trackIndex

	trackToPictureStoreMap map[string]string // ID to MIME
	mutex                  sync.RWMutex

	WorkingDirectory string
	cacheDirectory   string

	identityStorage *identityStorage.IdentityStorage
	config          *config.Config
}

func New(directory string, idStorage *identityStorage.IdentityStorage, config *config.Config) (*Indexer, error) {
	workingDirectory, err := os.Getwd()
	if err != nil {
		return &Indexer{}, fmt.Errorf("Failed to retrieve working directory: %w", err)
	}

	libraryCache, err := config.GetCacheDirectory()
	if err != nil {
		return nil, fmt.Errorf("failed to get cache directory: %w", err)
	}

	indexer := Indexer{
		Index: &trackIndex{
			Root:    directory,
			Tracks:  make(map[string]*Track),
			Albums:  make(map[string]*Album),
			Artists: make(map[string]*Artist),

			Mutex: sync.RWMutex{},
		},

		trackToPictureStoreMap: make(map[string]string), // ID to MIME

		WorkingDirectory: workingDirectory,
		cacheDirectory:   libraryCache,

		identityStorage: idStorage,
		config:          config,
	}

	waitGroup := sync.WaitGroup{}
	err = indexer.walk(indexer.Index.Root, &waitGroup)
	if err != nil {
		return &Indexer{}, fmt.Errorf("Failed to walk IndexRoot: %w", err)
	}
	waitGroup.Wait()

	indexer.cleanupAlbums()
	indexer.cleanupArtists()

	indexer.SetupSlowArtistExtraMetadataLoop()

	return &indexer, nil
}

func (s *Indexer) indexTrack(directory string) error {
	track, err := s.fileMetaData(directory)
	if err != nil {
		return fmt.Errorf("Failed to retrieve File Metadata: %w", err)
	}

	// lock mutex
	s.Index.Mutex.Lock()
	defer s.Index.Mutex.Unlock()

	if _, ok := s.Index.Tracks[track.ID]; ok {
		// already exists
		return errors.New("Two tracks of the same ID are present (both are titled '" + track.Title + "' by '" + track.Artist + "')")
	}

	// write data
	s.Index.Tracks[track.ID] = &track

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
