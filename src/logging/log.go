package logging

import (
	"fmt"
	"musica-server/src/config"
	"os"
	"strings"
	"sync"
	"time"
)

type Logger struct {
	DebugMode bool
	file      *os.File
	mutex     sync.Mutex
}

func New(config *config.Config) (*Logger, error) {
	logFile, err := os.OpenFile(config.LogFile, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
	if err != nil {
		return nil, fmt.Errorf("failed to open log file: %w", err)
	}

	logFile.WriteString("\nNew instance at " + now() + "\n")

	return &Logger{
		DebugMode: config.DebugMode,
		file:      logFile,
		mutex:     sync.Mutex{},
	}, nil
}

func now() string {
	now := time.Now()
	return now.Format("2006-01-02 15:04:05")
}

func asStrings(values []any) []string {
	result := make([]string, len(values))

	for i, value := range values {
		result[i] = fmt.Sprint(value)
	}

	return result
}

func (l *Logger) Debug(values ...any) {
	if !l.DebugMode {
		return
	}

	l.mutex.Lock()
	defer l.mutex.Unlock()

	strs := asStrings(values)

	pre := "[" + now() + "] DEBUG:"
	msg := pre + " " + strings.Join(strs, " ")

	l.file.WriteString(msg + "\n")
	fmt.Println(msg)
}

func (l *Logger) Log(values ...any) {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	strs := asStrings(values)

	pre := "[" + now() + "] INFO:"
	msg := pre + " " + strings.Join(strs, " ")

	l.file.WriteString(msg + "\n")
	fmt.Println(msg)
}

func (l *Logger) Warn(values ...any) {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	strs := asStrings(values)

	pre := "[" + now() + "] WARNING:"
	msg := pre + " " + strings.Join(strs, " ")

	l.file.WriteString(msg + "\n")
	fmt.Fprintln(os.Stderr, msg)
}

func (l *Logger) Error(values ...any) {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	strs := asStrings(values)

	pre := "[" + now() + "] ERROR:"
	msg := pre + " " + strings.Join(strs, " ")

	l.file.WriteString(msg + "\n")
	fmt.Fprintln(os.Stderr, msg)
}
