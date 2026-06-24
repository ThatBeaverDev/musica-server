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

func New() (*Config, error) {
	var Cfg Config

	// Open the configuration file.
	file, err := os.Open("config.json")
	if err != nil {
		return &Config{}, fmt.Errorf("Failed to open config file: %w", err)
	}
	defer file.Close()

	// Decode the JSON configuration into the config struct.
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&Cfg)
	if err != nil {
		return &Config{}, fmt.Errorf("Failed to open decode JSON config: %w", err)
	}

	if Cfg.MediaLibrary == "" {
		Cfg.MediaLibrary = "audio"
	}
	if Cfg.MediaCache == "" {
		Cfg.MediaCache = "mediaCache"
	}
	if Cfg.Port == 0 {
		Cfg.Port = 3000
	}

	return &Cfg, nil
}
