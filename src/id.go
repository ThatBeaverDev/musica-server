package ids

import (
	"errors"
	"fmt"
	"hash/fnv"
	"os"
	"sync"
)

type IdentityStorage struct {
	trackIds   sync.Map
	trackMutex sync.RWMutex

	albumSpecifierToId sync.Map
	albumIdToSpecifier sync.Map
	nextAlbumId        int32
	albumMutex         sync.RWMutex

	artistSpecifierToId sync.Map
	artistIdToSpecifier sync.Map
	nextArtistId        int32
	artistMutex         sync.RWMutex

	workingDirectory string
}

func New() (*IdentityStorage, error) {
	workingDirectory, err := os.Getwd()
	if err != nil {
		return &IdentityStorage{}, fmt.Errorf("Failed to retrieve working directory: %w", err)
	}

	return &IdentityStorage{
		trackIds: sync.Map{},

		albumSpecifierToId: sync.Map{},
		albumIdToSpecifier: sync.Map{},
		nextAlbumId:        0,

		workingDirectory: workingDirectory,
	}, nil
}

func Hash(s string) uint32 {
	h := fnv.New32a()
	h.Write([]byte(s))
	return h.Sum32()
}

func (s *IdentityStorage) TrackId(title string, artist string) (string, error) {
	specifier := title + "|" + artist
	//cleanPath := filepath.ToSlash(filepath.Clean(dir))

	s.trackMutex.Lock()
	defer s.trackMutex.Unlock()

	if id, ok := s.trackIds.Load(specifier); ok {
		return fmt.Sprint(id), nil
	}

	newID := fmt.Sprint(Hash(specifier))
	s.trackIds.Store(specifier, newID)

	return newID, nil
}

func (s *IdentityStorage) SpecifierToAlbumId(specifier string) string {
	s.albumMutex.Lock()
	defer s.albumMutex.Unlock()

	id, ok := s.albumSpecifierToId.Load(specifier)

	if ok {
		return fmt.Sprint(id)
	} else {
		newId := fmt.Sprint(Hash(specifier))

		s.albumSpecifierToId.Store(specifier, newId)
		s.albumIdToSpecifier.Store(newId, specifier)

		return newId
	}
}

func (s *IdentityStorage) AlbumIdToSpecifier(id string) (string, error) {
	s.albumMutex.RLock()
	defer s.albumMutex.RUnlock()

	specifier, ok := s.albumIdToSpecifier.Load(id)

	if ok {
		return fmt.Sprint(specifier), nil
	} else {
		return "", errors.New("Specifier has no assigned album ID.")
	}
}

func (s *IdentityStorage) ASpecifierToArtistId(specifier string) string {
	s.artistMutex.Lock()
	defer s.artistMutex.Unlock()

	id, ok := s.artistSpecifierToId.Load(specifier)

	if ok {
		return fmt.Sprint(id)
	} else {
		newId := fmt.Sprint(Hash(specifier))

		s.artistSpecifierToId.Store(specifier, newId)
		s.artistIdToSpecifier.Store(newId, specifier)

		return newId
	}
}

func (s *IdentityStorage) ArtistIdToASpecifier(id string) (string, error) {
	s.artistMutex.RLock()
	defer s.artistMutex.RUnlock()

	specifier, ok := s.artistIdToSpecifier.Load(id)

	if ok {
		return fmt.Sprint(specifier), nil
	} else {
		return "", errors.New("Specifier has no assigned artist ID.")
	}
}
