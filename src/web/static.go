package webServer

import (
	"net/http"
	"os"
)

func (ws *WebServer) static(route, filePath, contentType string) {
	ws.router.Get(route, func(w http.ResponseWriter, r *http.Request) {
		data, err := os.ReadFile(filePath)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		w.Header().Set("Content-Type", contentType)
		w.Write(data)
	})
}
