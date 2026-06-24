package ids

import (
	"errors"
	"fmt"
	"hash/fnv"
	"os"
	"path"
	"sync"
)

type IdentityStorage struct {
	trackIds   sync.Map
	trackMutex sync.RWMutex

	albumSpecifierToId sync.Map
	albumIdToSpecifier sync.Map
	nextAlbumId        int32
	albumMutex         sync.RWMutex

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

func hash(s string) uint32 {
	h := fnv.New32a()
	h.Write([]byte(s))
	return h.Sum32()
}

func (s *IdentityStorage) TrackId(dir string) (string, error) {
	directory := path.Join(s.workingDirectory, dir)

	s.trackMutex.Lock()
	defer s.trackMutex.Unlock()

	id, ok := s.trackIds.Load(directory)
	if ok {
		return fmt.Sprint(id), nil
	} else {
		newID := fmt.Sprint(hash(directory))

		s.trackIds.Store(directory, newID)

		return fmt.Sprint(newID), nil
	}
}

func (s *IdentityStorage) SpecifierToAlbumId(specifier string) string {
	s.albumMutex.Lock()
	defer s.albumMutex.Unlock()

	id, ok := s.albumSpecifierToId.Load(specifier)

	if ok {
		return fmt.Sprint(id)
	} else {
		newId := fmt.Sprint(hash(specifier))

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
		return "", errors.New("Specifier has no assigned ID.")
	}
}
