package indexer

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	_ "image/png"
	"net/http"
	"os"
	"path"

	"github.com/cenkalti/dominantcolor"
	"github.com/nfnt/resize"
	taglib "go.senan.xyz/taglib"
	_ "golang.org/x/image/bmp"
	_ "golang.org/x/image/tiff"
	_ "golang.org/x/image/webp"
)

type CoverResult struct {
	Mime      string
	Directory string
}

func FindDominantColour(fileInput string) (string, error) {
	f, err := os.Open(fileInput)
	if err != nil {
		fmt.Println("File not found:", fileInput)
		return "", err
	}
	defer f.Close()
	img, _, err := image.Decode(f)
	if err != nil {
		return "", err
	}

	return dominantcolor.Hex(dominantcolor.Find(img)), nil
}

func processAndSaveImage(rawBytes []byte, destPath string, maxDimension uint) error {
	// decode into image.Image
	img, _, err := image.Decode(bytes.NewReader(rawBytes))
	if err != nil {
		return fmt.Errorf("failed to decode image: %w", err)
	}

	// resize
	resizedImg := resize.Thumbnail(maxDimension, maxDimension, img, resize.Lanczos3)

	// create cache file
	outFile, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("failed to create cache file: %w", err)
	}
	defer outFile.Close()

	// compress as JPEG
	opts := jpeg.Options{Quality: 80}
	if err := jpeg.Encode(outFile, resizedImg, &opts); err != nil {
		return fmt.Errorf("failed to encode image as JPEG: %w", err)
	}

	return nil
}

const fallbackArt = "./public/img/no-art.png"

var FallbackCover = CoverResult{Mime: "image/png", Directory: fallbackArt}

func (s *Indexer) GetCover(track Track) (CoverResult, error) {
	artPath := path.Join(
		s.CacheDirectory,
		fmt.Sprint("track_", track.ID, "_art"),
	)

	s.mutex.RLock()

	// cache hit
	if mime, ok := s.trackToPictureStoreMap[track.ID]; ok {
		s.mutex.RUnlock()
		return CoverResult{
			Mime:      mime,
			Directory: artPath,
		}, nil
	}
	s.mutex.RUnlock()

	// read image from audio file
	imgBytes, err := taglib.ReadImage(track.Path)
	if err != nil {
		fmt.Println("failed to load cover image for ID '"+track.ID+"':", err)
		return FallbackCover, nil
	}

	// fallback if no image exists
	if imgBytes == nil {
		fmt.Println("no cover for ID '" + track.ID + "' exists")
		return FallbackCover, nil
	}

	// resize and write to disk
	err = processAndSaveImage(imgBytes, artPath, 500)
	if err != nil {
		fmt.Println("could not process/save image for ID '"+track.ID+"', using fallback:", err)

		return FallbackCover, nil
	}

	// store mime (best-effort detection via file header)
	mime := http.DetectContentType(imgBytes)
	s.mutex.Lock()
	s.trackToPictureStoreMap[track.ID] = mime
	s.mutex.Unlock()

	return CoverResult{
		Mime:      mime,
		Directory: artPath,
	}, nil
}
