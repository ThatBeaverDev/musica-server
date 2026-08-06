package config

import (
	"encoding/json"
	"fmt"
	"os"
)

type Config struct {
	Port int `json:"port"`

	MediaLibrary string `json:"mediaLibrary"`
	MediaCache   string `json:"mediaCache"`
}

const defaultPort = 3000
const defaultMediaCache = "mediaCache"
const defaultMediaLibrary = "audio"

func New() (*Config, error) {
	var Cfg Config

	// Open the configuration file.
	file, err := os.Open("config.json")
	if err != nil {
		return &Config{Port: defaultPort, MediaLibrary: defaultMediaLibrary, MediaCache: defaultMediaCache}, nil
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
	if Cfg.MediaCache == "" {
		Cfg.MediaCache = defaultMediaCache
	}
	if Cfg.Port == 0 {
		Cfg.Port = defaultPort
	}

	return &Cfg, nil
}
