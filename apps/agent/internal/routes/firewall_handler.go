package routes

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

// FirewallEntry represents a blocked target
type FirewallEntry struct {
	Target    string `json:"target"`
	Type      string `json:"type"` // ip, range, country
	Reason    string `json:"reason,omitempty"`
	Added     string `json:"added"`
	Expires   string `json:"expires,omitempty"`
	ExpiresAt time.Time `json:"-"`
}

// FirewallBlockRequest is the body for block/unblock requests
type FirewallBlockRequest struct {
	Type     string `json:"type"`     // ip, range, country
	Value    string `json:"value"`    // the IP, range, or country code
	Reason   string `json:"reason,omitempty"`
	Duration string `json:"duration,omitempty"` // 1h, 24h, 7d, permanent
}

type FirewallUnblockRequest struct {
	Value string `json:"value"`
}

// In-memory blocklist
var (
	blocklist   []FirewallEntry
	blocklistMu sync.RWMutex
)

func parseDuration(d string) (time.Time, string) {
	now := time.Now().UTC()
	switch d {
	case "1h":
		return now.Add(1 * time.Hour), "1h"
	case "24h":
		return now.Add(24 * time.Hour), "24h"
	case "7d":
		return now.Add(7 * 24 * time.Hour), "7d"
	default:
		return time.Time{}, "permanent"
	}
}

// HandleListFirewall returns the list of blocked IPs/ranges/countries
func (h *Handler) HandleListFirewall(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	blocklistMu.RLock()
	defer blocklistMu.RUnlock()

	// Filter out expired entries
	now := time.Now().UTC()
	active := make([]FirewallEntry, 0, len(blocklist))
	for _, entry := range blocklist {
		if !entry.ExpiresAt.IsZero() && entry.ExpiresAt.Before(now) {
			continue
		}
		active = append(active, entry)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"entries": active,
		"total":   len(active),
	})
}

// HandleBlockIP adds an IP, range, or country to the blocklist
func (h *Handler) HandleBlockIP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req FirewallBlockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Value == "" {
		http.Error(w, `{"error":"value is required"}`, http.StatusBadRequest)
		return
	}

	if req.Type == "" {
		req.Type = "ip"
	}

	expiresAt, expiresStr := parseDuration(req.Duration)

	entry := FirewallEntry{
		Target:    req.Value,
		Type:      req.Type,
		Reason:    req.Reason,
		Added:     time.Now().UTC().Format(time.RFC3339),
		Expires:   expiresStr,
		ExpiresAt: expiresAt,
	}

	blocklistMu.Lock()
	defer blocklistMu.Unlock()

	// Check for duplicates
	for _, existing := range blocklist {
		if existing.Target == req.Value && existing.Type == req.Type {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"status":  "ok",
				"message": "Already blocked",
				"target":  req.Value,
			})
			return
		}
	}

	blocklist = append(blocklist, entry)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
		"action": "block",
		"target": req.Value,
	})
}

// HandleUnblockIP removes an entry from the blocklist
func (h *Handler) HandleUnblockIP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req FirewallUnblockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Value == "" {
		http.Error(w, `{"error":"value is required"}`, http.StatusBadRequest)
		return
	}

	blocklistMu.Lock()
	defer blocklistMu.Unlock()

	for i, entry := range blocklist {
		if entry.Target == req.Value {
			blocklist = append(blocklist[:i], blocklist[i+1:]...)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"status": "ok",
				"action": "unblock",
				"target": req.Value,
			})
			return
		}
	}

	http.Error(w, `{"error":"target not found in blocklist"}`, http.StatusNotFound)
}
