package main

import (
	"log"
	identityStorage "musica-server/src"
	"musica-server/src/config"
	"musica-server/src/indexer"
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
	workingDirectory, err := os.Getwd()
	if err != nil {
		log.Fatalln(err)
	}

	idStorage, err := identityStorage.New()
	if err != nil {
		log.Fatalln(err)
	}

	config, err := config.New()
	if err != nil {
		log.Fatalln(err)
	}

	indexerDirectory := resolvePath(workingDirectory, config.MediaLibrary)

	indexer, err := indexer.New(indexerDirectory, idStorage, config)
	if err != nil {
		log.Fatalln(err)
	}

	server := webServer.New(indexer, idStorage)

	err = server.Listen(config.Port)
	if err != nil {
		log.Fatalln(err)
	}
}
