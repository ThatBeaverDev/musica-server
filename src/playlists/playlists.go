package playlists

import (
	"fmt"
	"musica-server/src/indexer"
	"musica-server/src/logging"
	"sync"
)

type Playlist struct {
	Name           string `json:"name"`
	Description    string `json:"description"`
	PictureTrackId string `json:"pictureTrackId"` // track id

	Tracks []*indexer.Track `json:"tracks"`
	Id     int64            `json:"id"`
}

type PlaylistMap map[int64]Playlist

type PlaylistManager struct {
	Playlists PlaylistMap `json:"playlists"` // id to playlist
	NextId    int64       `json:"nextId"`

	logger  *logging.Logger
	indexer *indexer.Indexer

	mutex *sync.RWMutex
}

func New(logger *logging.Logger, indexer *indexer.Indexer) (*PlaylistManager, error) {
	playlists, err := readPlaylists(indexer)
	if err != nil {
		return nil, fmt.Errorf("failed to read playlists from disk: %w", err)
	}

	manager := &PlaylistManager{
		Playlists: playlists,
		NextId:    0,

		logger:  logger,
		indexer: indexer,

		mutex: &sync.RWMutex{},
	}

	go manager.store()

	return manager, nil
}

func (p *PlaylistManager) generatePlaylistId() int64 {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	return p.generatePlaylistIdUnsafe()
}

func (p *PlaylistManager) generatePlaylistIdUnsafe() int64 {
	id := p.NextId
	p.NextId++

	return id
}

func (p *PlaylistManager) NewPlaylist(title string, description string, tracks []*indexer.Track) Playlist {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	id := p.generatePlaylistIdUnsafe()

	playlist := Playlist{
		Name:           title,
		Description:    description,
		PictureTrackId: tracks[0].ID,

		Tracks: tracks,
		Id:     id,
	}

	p.Playlists[id] = playlist

	return playlist
}

func store() {}
