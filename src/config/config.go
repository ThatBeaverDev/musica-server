package config

import (
	"encoding/json"
	"fmt"
	ids "musica-server/src"
	"os"
	"path"
)

type Config struct {
	Port int `json:"port"`

	MediaLibrary string `json:"mediaLibrary"`

	ScoresFile  string `json:"scores"`
	HistoryFile string `json:"history"`
}

const defaultPort = 3000
const defaultMediaLibrary = "audio"
const defaultScoresFile = "scores.json"
const defaultHistoryFile = "history.json"

func New() (*Config, error) {
	var Cfg Config

	// Open the configuration file.
	file, err := os.Open("config.json")
	if err != nil {
		return &Config{Port: defaultPort, MediaLibrary: defaultMediaLibrary}, nil
	}
	defer file.Close()

	// Decode the JSON configuration into the config struct.
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&Cfg)
	if err != nil {
		return &Config{}, fmt.Errorf("Failed to open decode JSON config: %w", err)
	}

	if Cfg.MediaLibrary == "" {
		Cfg.MediaLibrary = defaultMediaLibrary
	}
	if Cfg.Port == 0 {
		Cfg.Port = defaultPort
	}
	if Cfg.ScoresFile == "" {
		Cfg.ScoresFile = defaultScoresFile
	}
	if Cfg.HistoryFile == "" {
		Cfg.HistoryFile = defaultHistoryFile
	}

	return &Cfg, nil
}

func (config *Config) GetCacheDirectory() (string, error) {
	musicaCacheDir := "./cache"

	libraryhash := fmt.Sprint(ids.Hash(config.MediaLibrary))

	libraryCache := path.Join(musicaCacheDir, libraryhash)
	err := os.MkdirAll(libraryCache, 0700)
	if err != nil {
		return "", fmt.Errorf("Failed to create musica library cache directory: %w", err)
	}

	return libraryCache, nil
}
