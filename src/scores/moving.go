package scores

import (
	"errors"
	"fmt"
)

func (s *ScoreManager) ChangeTrackId(oldID string, newID string) error {
	s.storeMutex.Lock()
	defer s.storeMutex.Unlock()

	if _, ok := s.trackScores[newID]; ok {
		return errors.New("track with new ID already exists in scores.")
	}

	scoreData, ok := s.trackScores[oldID]
	if ok {

		err := s.history.ChangeTrackId(oldID, newID)
		if err != nil {
			return fmt.Errorf("failed to change history track id: %w", err)
		}

		delete(s.trackScores, oldID)
		s.trackScores[newID] = scoreData
	}

	s.storeUnsafe()
	return nil
}
