package main

import (
	"log"
	identityStorage "musica-server/src"
	"musica-server/src/config"
	"musica-server/src/edit"
	"musica-server/src/indexer"
	"musica-server/src/logging"
	"musica-server/src/playlists"
	scores "musica-server/src/scores"
	webServer "musica-server/src/web"
	"os"
	"path/filepath"
)

func resolvePath(base, input string) string {
	// if absolute, ignore base
	if filepath.IsAbs(input) {
		return filepath.Clean(input)
	}

	// Otherwise join with base
	return filepath.Clean(filepath.Join(base, input))
}

func main() {
	config, err := config.New()
	if err != nil {
		log.Fatalln(err)
	}

	logger, err := logging.New(config)
	if err != nil {
		log.Fatalln(err)
	}

	workingDirectory, err := os.Getwd()
	if err != nil {
		logger.Error(err)
		return
	}

	idStorage, err := identityStorage.New()
	if err != nil {
		logger.Error(err)
		return
	}

	indexerDirectory := resolvePath(workingDirectory, config.MediaLibrary)

	indexer, err := indexer.New(indexerDirectory, idStorage, config, logger)
	if err != nil {
		logger.Error(err)
		return
	}

	logger.Log("")
	logger.Log("Indexed:")
	logger.Log("-", len(indexer.Index.Tracks), "Tracks,")
	logger.Log("-", len(indexer.Index.Albums), "Albums and")
	logger.Log("-", len(indexer.Index.Artists), "Artists!")
	logger.Log("")

	scorer, err := scores.New(indexer)
	if err != nil {
		logger.Error(err)
		return
	}

	playlistManager, err := playlists.New(logger, indexer)
	if err != nil {
		logger.Error(err)
		return
	}

	if config.OrganiseLibrary {
		err := edit.ReorganiseLibrary(indexer)
		if err != nil {
			logger.Error(err)
			return
		}
	}

	server := webServer.New(indexer, idStorage, scorer, playlistManager)

	err = server.Listen(config.Port)
	if err != nil {
		logger.Error(err)
		return
	}
}
