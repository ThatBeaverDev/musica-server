package history

import "errors"

func (s *HistoryManager) ChangeTrackId(oldID string, newID string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if _, ok := s.History.Tracks[newID]; ok {
		return errors.New("track with new ID already exists in history.")
	}

	historyData, ok := s.History.Tracks[oldID]
	if ok {
		delete(s.History.Tracks, oldID)
		s.History.Tracks[newID] = historyData
	}

	s.storeUnsafe()
	return nil
}
