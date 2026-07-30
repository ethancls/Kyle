# Kyle — Task Tracking

## Done

- [x] Monorepo, Next.js 15 dashboard, 8 pages
- [x] Design system: OLED black/white + #0066FF + Phosphor + Geist
- [x] Sidebar: collapsible, dot-grid, dragon logo, Orbitron "KYLE"
- [x] Light/dark theme with system follow + toggle
- [x] Responsive: sidebar (desktop) + bottom nav (mobile)
- [x] /services: 21 live services, search, refresh, restart/stop/start via agent
- [x] Agent Go: services list, Docker actions, merges Traefik + docker ps
- [x] Dashboard: 3D globe, real service KPIs, skeletons
- [x] /api/geo: IP geolocation via ip-api.com
- [x] Traefik accessLog: JSON format, volume-mapped to ./logs
- [x] Agent reads live Traefik access logs, serves via /api/logs/access
- [x] Docs: architecture.md, current.md, design spec

## In Progress (3 subagents)

- [ ] /logs: real-time log viewer with filters (method, status, path)
- [ ] /api/analytics: log aggregation (status breakdown, top paths, latency)
- [ ] /analytics: Recharts charts (status, paths, req/min, latency)
- [ ] /firewall: IP blocking (agent endpoints + UI form + table)
- [ ] /agents: agent health display
- [ ] Dashboard: simplified, real data where possible
- [ ] /settings: fixed theme toggle, agent config display
- [ ] /alerts: clean placeholder

## Next

- [ ] GeoIP enrichment for log IPs → globe arcs
- [ ] Alert webhook (Discord)
- [ ] Docker Compose for Kyle stack
- [ ] TLS/HTTPS for agent
