package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"sort"
	"strings"
)

type ServiceInfo struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Status   string `json:"status"`
	URL      string `json:"url"`
	Hostname string `json:"hostname,omitempty"`
}

type ServiceAction struct {
	Service string `json:"service"`
}

// HandleListServices returns services by merging Traefik config with Docker state
func (h *Handler) HandleListServices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get Traefik runtime data (only shows active services)
	traefikServices := make(map[string]ServiceInfo)

	resp, err := http.Get("http://localhost:8080/api/rawdata")
	if err == nil {
		defer resp.Body.Close()

		var data struct {
			Services map[string]struct {
				ServerStatus map[string]string `json:"serverStatus"`
				LoadBalancer *struct {
					Servers []struct{ URL string } `json:"servers"`
				} `json:"loadBalancer"`
			} `json:"services"`
			Routers map[string]struct {
				Rule    string `json:"rule"`
				Service string `json:"service"`
			} `json:"routers"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&data); err == nil {
			skip := map[string]bool{"api@internal": true, "dashboard@internal": true, "noop@internal": true}

			for key, svc := range data.Services {
				if skip[key] || strings.HasPrefix(key, "traefik-") {
					continue
				}
				name := cleanName(key)

				var url string
				if svc.LoadBalancer != nil && len(svc.LoadBalancer.Servers) > 0 {
					url = svc.LoadBalancer.Servers[0].URL
				} else {
					url = "-"
				}

				hostname := extractHostname(name, key, data.Routers)

				traefikServices[name] = ServiceInfo{
					ID:       key,
					Name:     name,
					Status:   "running",
					URL:      url,
					Hostname: hostname,
				}
			}
		}
	}

	// Get Docker container state for all containers
	dockerState := make(map[string]string) // name -> state
	cmd := exec.Command("docker", "ps", "-a", "--format", "{{.Names}} {{.State}}")
	output, err := cmd.Output()
	if err == nil {
		for _, line := range strings.Split(strings.TrimSpace(string(output)), "\n") {
			if line == "" {
				continue
			}
			parts := strings.SplitN(line, " ", 2)
			if len(parts) == 2 {
				name := strings.TrimSpace(parts[0])
				state := strings.TrimSpace(parts[1])
				dockerState[name] = state
			}
		}
	}

	// Merge: Traefik services + Docker-only services (stopped containers)
	merged := make(map[string]ServiceInfo)

	for name, svc := range traefikServices {
		if dState, ok := dockerState[name]; ok {
			if dState == "running" || strings.HasPrefix(dState, "Up") {
				svc.Status = "running"
			} else {
				svc.Status = "stopped"
			}
		}
		merged[name] = svc
	}

	// Add stopped Docker containers that have Traefik labels but aren't in Traefik runtime
	for dName, dState := range dockerState {
		if _, ok := merged[dName]; ok {
			continue
		}
		if dState == "running" || strings.HasPrefix(dState, "Up") {
			continue
		}
		// Check Docker labels for Traefik enablement
		labelCmd := exec.Command("docker", "inspect", "-f",
			"{{index .Config.Labels \"traefik.enable\"}}",
			dName)
		labelOutput, err := labelCmd.Output()
		if err != nil {
			continue
		}
		label := strings.TrimSpace(string(labelOutput))
		if label == "true" {
			merged[dName] = ServiceInfo{
				ID:       dName + "@docker",
				Name:     dName,
				Status:   "stopped",
				URL:      "-",
				Hostname: "",
			}
		}
	}

	// Build sorted list
	services := make([]ServiceInfo, 0, len(merged))
	for _, svc := range merged {
		services = append(services, svc)
	}
	sort.Slice(services, func(i, j int) bool {
		return services[i].Name < services[j].Name
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"services": services,
		"total":    len(services),
	})
}

func cleanName(key string) string {
	name := key
	name = strings.TrimSuffix(name, "@docker")
	name = strings.TrimSuffix(name, "@file")
	return name
}

func extractHostname(name, key string, routers map[string]struct {
	Rule    string `json:"rule"`
	Service string `json:"service"`
}) string {
	rawName := strings.TrimSuffix(key, "@docker")
	rawName = strings.TrimSuffix(rawName, "@file")

	for _, router := range routers {
		if router.Service == name || router.Service == key || router.Service == rawName {
			rule := router.Rule
			if idx := strings.Index(rule, "Host(`"); idx != -1 {
				rest := rule[idx+6:]
				if end := strings.Index(rest, "`)"); end != -1 {
					return rest[:end]
				}
			}
			break
		}
	}
	return ""
}

func (h *Handler) HandleRestartService(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var action ServiceAction
	if err := json.NewDecoder(r.Body).Decode(&action); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	cmd := exec.Command("docker", "restart", action.Service)
	output, err := cmd.CombinedOutput()
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s: %v"}`, string(output), err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "action": "restart", "service": action.Service})
}

func (h *Handler) HandleStopService(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var action ServiceAction
	if err := json.NewDecoder(r.Body).Decode(&action); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	cmd := exec.Command("docker", "stop", action.Service)
	output, err := cmd.CombinedOutput()
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s: %v"}`, string(output), err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "action": "stop", "service": action.Service})
}

func (h *Handler) HandleStartService(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var action ServiceAction
	if err := json.NewDecoder(r.Body).Decode(&action); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	cmd := exec.Command("docker", "start", action.Service)
	output, err := cmd.CombinedOutput()
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s: %v"}`, string(output), err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "action": "start", "service": action.Service})
}
