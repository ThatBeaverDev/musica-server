package indexer

import (
	"errors"
)

func (s *Indexer) ChangeTrackId(oldID string, newID string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if _, ok := s.Index.Tracks[newID]; ok {
		return errors.New("track with new ID already exists in scores.")
	}

	scoreData, ok := s.Index.Tracks[oldID]
	if ok {
		delete(s.Index.Tracks, oldID)
		s.Index.Tracks[newID] = scoreData

		pictureStore, ok := s.trackToPictureStoreMap[oldID]
		if ok {
			delete(s.trackToPictureStoreMap, oldID)
			s.trackToPictureStoreMap[newID] = pictureStore
		}
	}

	return nil
}
