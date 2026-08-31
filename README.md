# Musica-Server

Musica server is a golang server and typescript-client in one for streaming
music to a browser/external client.

## What sets it apart from others?

One of Musica's primary features which sets it apart from others is it's
reliance on file metadata tagging. Musica server uses these tags solely to
discern track information, and the server itself can re-tag files once edited on
the clientside, so even if you stop using Musica, other programs will have the
same metadata after the fact.

Another of Musica's primary features is that it uses a scoring system for tracks
in a dynamic queueing system to learn what tracks the user does and does not
like, whilst giving tracks that the user used to dislike the chance to reappear.
It is planned to add 'vibe' sorting, so tracks only appear in their given vibe,
so quick vibe swings don't mix everything up.

## Installation

Musica can be ran locally by cloning this repository and running the `setup.sh`
file first time, then `build.sh` on prior runs, then the musica-server binary.

Docker is also supported, as long as you build it yourself. Simply clone and run
`docker build .`. A basic docker-compose is provided.

There are no native apps, only the webserver, though these are on my mind. The
server's default port is 3000 but this can be configred, see the configuration
guide below.

## Configuration

the `config.json` file is used to configure the server. This is set statically
in docker since this is used to specify directories and ports, which is done
through docker mappings.

| Property       | Default Value    | Meaning                                                                                                                                |
| -------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `port`         | `3000`           | Port to use for the webUI and API.                                                                                                     |
| `mediaLibrary` | `./audio`        | Directory in which media files are stored in.                                                                                          |
| `scores`       | `./scores.json`  | File for scores to be stored in. Must be atomically-writable (don't map specifically this file in docker, map the parent folder)       |
| `history`      | `./history.json` | File for history data to be stored in. Must be atomically-writable (don't map specifically this file in docker, map the parent folder) |
