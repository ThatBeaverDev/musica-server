package util

import (
	"fmt"
	"time"
)

func ParseYear(value string) (*time.Time, error) {
	layouts := []string{
		"02-01-2006",
		"2-1-2006",

		"2006-01-02",
		"2006-1-2",

		"2006-01",
		"2006-1",

		"2006",

		"02/01/2006",
		"2/1/2006",

		"2006/01/02",
		"2006/1/2",
		time.RFC3339,
	}

	for _, layout := range layouts {
		parsedTime, err := time.Parse(layout, value)
		if err == nil {
			return &parsedTime, nil
		}
	}

	return nil, fmt.Errorf("unparseable date: %s", value)
}
