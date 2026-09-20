package playlists

import (
	"fmt"
	"musica-server/src/indexer"
	"musica-server/src/logging"
	"strconv"
	"sync"
)

type Playlist struct {
	Name           string `json:"name"`
	Description    string `json:"description"`
	PictureTrackId string `json:"pictureTrackId"` // track id

	TrackIds []string `json:"tracks"`
	ID       string   `json:"id"`
}

type PlaylistMap map[string]*Playlist

type PlaylistManager struct {
	Playlists PlaylistMap `json:"playlists"` // id to playlist
	NextId    int         `json:"nextId"`

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

func (p *PlaylistManager) generatePlaylistId() string {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	return p.generatePlaylistIdUnsafe()
}

func (p *PlaylistManager) generatePlaylistIdUnsafe() string {
	id := p.NextId
	p.NextId++

	return strconv.Itoa(id)
}

func (p *PlaylistManager) NewPlaylist(title string, description string, tracks []*indexer.Track) *Playlist {
	p.mutex.Lock()

	id := p.generatePlaylistIdUnsafe()

	var ids []string
	for _, track := range tracks {
		ids = append(ids, track.ID)
	}

	playlist := &Playlist{
		Name:           title,
		Description:    description,
		PictureTrackId: ids[0],

		TrackIds: ids,
		ID:       id,
	}

	p.Playlists[id] = playlist
	p.mutex.Unlock()

	go p.store()

	return playlist
}

func store() {}
