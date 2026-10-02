package playlists

import (
	"errors"
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
	playlists PlaylistMap // id to playlist
	nextId    int

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
		playlists: playlists,
		nextId:    0,

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
	id := p.nextId
	p.nextId++

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

	p.playlists[id] = playlist
	p.mutex.Unlock()

	go p.store()

	return playlist
}

func (p *PlaylistManager) PlaylistById(id string) (*Playlist, error) {
	playlist, ok := p.playlists[id]
	if !ok {
		return nil, errors.New("Playlist not found")
	}

	return playlist, nil
}

func (p *PlaylistManager) PlaylistIds() []string {
	list := []string{}

	for id := range p.playlists {
		list = append(list, id)
	}

	return list
}

func (p *PlaylistManager) DeletePlaylist(id string) error {
	delete(p.playlists, id)
	go p.store()

	return nil
}

func (p *PlaylistManager) SetPlaylistItems(playlistId string, tracks []*indexer.Track) error {
	p.mutex.Lock()

	playlist, err := p.PlaylistById(playlistId)
	if err != nil {
		return fmt.Errorf("failed to retrieve track: %w", err)
	}

	playlist.TrackIds = []string{}
	for _, track := range tracks {
		playlist.TrackIds = append(playlist.TrackIds, track.ID)
	}
	p.mutex.Unlock()

	go p.store()

	return nil
}
