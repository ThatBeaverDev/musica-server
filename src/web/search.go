package webServer

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (ws *WebServer) searchQuery(w http.ResponseWriter, r *http.Request) {
	query := chi.URLParam(r, "query")

	response := ws.search.Query(query)

	err := json.NewEncoder(w).Encode(response)
	if err != nil {
		ws.logger.Error("failed to encode JSON response: ", err.Error())
		http.Error(w, "failed to encode JSON response", http.StatusInternalServerError)
	}
}
