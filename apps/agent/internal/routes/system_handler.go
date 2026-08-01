package routes

import (
	"net/http"

	"kyle/agent/internal/utils"
	"kyle/agent/pkg/logs"
	"kyle/agent/pkg/system"
)

// HandleSystemLogs handles requests for system logs listing
func (h *Handler) HandleSystemLogs(w http.ResponseWriter, r *http.Request) {
	logSizes, err := logs.GetLogSizes(h.config.AccessPath)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondJSON(w, http.StatusOK, logSizes)
}

// HandleSystemResources handles requests for system resource statistics
func (h *Handler) HandleSystemResources(w http.ResponseWriter, r *http.Request) {
	if !h.config.SystemMonitoring {
		utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
			"status":              "disabled",
			"system_monitoring":   false,
			"message":             "System monitoring is disabled",
			"resources_available": false,
		})
		return
	}

	stats, err := system.MeasureSystem()
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondJSON(w, http.StatusOK, stats)
}
