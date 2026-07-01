package webServer

import (
	"fmt"
	"net/http"
	"os"
)

func (ws *WebServer) static(route, filePath, contentType string) {
	ws.router.Get(route, func(w http.ResponseWriter, r *http.Request) {
		data, err := os.ReadFile(filePath)
		if err != nil {
			fmt.Println(err)
			http.Error(w,"File for static method does not exist.", 500)
			return
		}

		w.Header().Set("Content-Type", contentType)
		w.Write(data)
	})
}
