package main

import (
	"log"
	identityStorage "musica-server/src"
	"musica-server/src/indexer"
	webServer "musica-server/src/web"
	"os"
	"path"
)

func main() {
	workingDirectory, err := os.Getwd()
	if err != nil {
		log.Fatalln(err)
	}

	idStorage, err := identityStorage.New()
	if err != nil {
		log.Fatalln(err)
	}

	indexerDirectory := path.Join(workingDirectory, "audio")

	indexer, err := indexer.New(indexerDirectory, idStorage)
	if err != nil {
		log.Fatalln(err)
	}

	server := webServer.New(&indexer, idStorage)

	err = server.Listen(3000)
	if err != nil {
		log.Fatalln(err)
	}
}
