// Shared types for Kyle — Traefik Traffic Dashboard

// ===== Agent API =====

export interface AgentConfig {
  id: string
  name: string
  url: string
  token: string
  tags: string[]
  location: 'onsite' | 'offsite'
  status: 'connected' | 'disconnected' | 'error'
  lastSeen: string
}

export interface AgentMetrics {
  requestsPerSecond: number
  avgLatencyMs: number
  errorRate: number
  activeSources: number
  uptime: string
  cpuPercent: number
  memoryPercent: number
  diskPercent: number
}

// ===== Logs =====

export interface LogEntry {
  id: string
  timestamp: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  path: string
  status: number
  ip: string
  country: string
  city: string
  latitude: number
  longitude: number
  latencyMs: number
  userAgent: string
  service: string
  router: string
}

export interface LogFilter {
  service?: string
  ip?: string
  status?: string
  method?: string
  country?: string
  pathRegex?: string
  startTime?: string
  endTime?: string
}

export interface LogsResponse {
  entries: LogEntry[]
  total: number
  page: number
  pageSize: number
}

// ===== Firewall =====

/** Matches the Go agent's FirewallEntry JSON shape exactly */
export interface FirewallEntry {
  target: string
  type: 'ip' | 'range' | 'country'
  reason?: string
  added: string
  expires: string
}

export interface FirewallBlockRequest {
  type: 'ip' | 'range' | 'country'
  value: string
  reason?: string
  duration?: string // "1h", "24h", "7d", "permanent"
}

// ===== Services =====

export interface ServiceInfo {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error'
  containerId?: string
  uptime: string
  cpuPercent: number
  memoryPercent: number
  requestsPerSecond: number
  avgLatencyMs: number
  url: string
  hostname?: string
}

// ===== Analytics =====

export interface AnalyticsData {
  totalRequests: number
  statusBreakdown: Record<string, number>
  topPaths: { path: string; count: number }[]
  topHosts: { host: string; count: number }[]
  avgLatencyMs: number
  requestsPerMinute: number
}

// ===== Alerts =====

export interface AlertRule {
  id: string
  name: string
  type: 'threshold' | 'status' | 'anomaly'
  metric: string
  condition: 'gt' | 'lt' | 'eq'
  value: number
  channels: ('discord' | 'webhook')[]
  enabled: boolean
  created: string
}
