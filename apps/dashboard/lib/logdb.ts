import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'kyle.db')

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('busy_timeout = 5000')

    db.exec(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        status INTEGER NOT NULL,
        client_ip TEXT NOT NULL,
        duration_ms REAL NOT NULL,
        host TEXT,
        router TEXT,
        service TEXT,
        raw_json TEXT,
        dedup_key TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_logs_time ON access_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_status ON access_logs(status);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_logs_dedup ON access_logs(dedup_key);
    `)

    // Migration: add dedup_key column to existing databases
    try {
      db.exec(`ALTER TABLE access_logs ADD COLUMN dedup_key TEXT`)
    } catch {
      // Column already exists — migration was applied previously
    }
    try {
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_logs_dedup ON access_logs(dedup_key)`)
    } catch {
      // Index already exists
    }
  }
  return db
}

// Insert logs into SQLite
export function insertLogs(logs: any[]) {
  const conn = getDb()
  const stmt = conn.prepare(`
    INSERT OR IGNORE INTO access_logs (timestamp, method, path, status, client_ip, duration_ms, host, router, service, raw_json, dedup_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // Simple hash function for dedup key
  function hash(s: string): string {
    let h = 0
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0
    }
    return (h >>> 0).toString(16).padStart(8, '0')
  }

  const insert = conn.transaction((entries: any[]) => {
    for (const l of entries) {
      const clientIp = (l.ClientHost || '').split(',')[0].trim()
      const durationMs = (l.Duration || 0) / 1_000_000
      const timestamp = l.StartUTC || l.StartLocal || l.time || new Date().toISOString()
      const method = l.RequestMethod || ''
      const path = l.RequestPath || ''
      const dedupKey = hash(`${timestamp}|${clientIp}|${path}|${method}`)

      stmt.run(
        timestamp,
        method,
        path,
        l.DownstreamStatus || 0,
        clientIp,
        durationMs,
        l.RequestHost || '',
        l.RouterName || '',
        l.ServiceName || '',
        JSON.stringify(l),
        dedupKey,
      )
    }
  })

  insert(logs)
}

// Query logs with filters
export function queryLogs(opts: {
  limit?: number; offset?: number; method?: string; status?: string; path?: string
}) {
  const conn = getDb()
  const conditions: string[] = []
  const params: any[] = []

  if (opts.method) { conditions.push('method = ?'); params.push(opts.method.toUpperCase()) }
  if (opts.status) {
    const prefix = opts.status.replace(/x/gi, '')
    if (prefix.length === 1) {
      const min = Number(prefix) * 100
      conditions.push('status >= ? AND status <= ?')
      params.push(min, min + 99)
    } else {
      conditions.push('status = ?')
      params.push(Number(opts.status))
    }
  }
  if (opts.path) {
    conditions.push('(path LIKE ? OR client_ip LIKE ?)')
    params.push(`%${opts.path}%`, `%${opts.path}%`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = Math.min(opts.limit || 100, 1000)

  const rows = conn.prepare(
    `SELECT * FROM access_logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, opts.offset || 0)

  const count = conn.prepare(
    `SELECT COUNT(*) as total FROM access_logs ${where}`
  ).get(...params) as { total: number }

  return { logs: rows, total: count.total }
}

// Analytics — all aggregation runs in SQL, not JS
export function getStats() {
  const conn = getDb()

  const total = (conn.prepare('SELECT COUNT(*) as n FROM access_logs').get() as any).n

  const statusBreakdown = conn.prepare(`
    SELECT
      SUM(CASE WHEN status >= 200 AND status < 300 THEN 1 ELSE 0 END) as s2xx,
      SUM(CASE WHEN status >= 300 AND status < 400 THEN 1 ELSE 0 END) as s3xx,
      SUM(CASE WHEN status >= 400 AND status < 500 THEN 1 ELSE 0 END) as s4xx,
      SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) as s5xx
    FROM access_logs
  `).get() as any

  const avgLat = (conn.prepare('SELECT AVG(duration_ms) as avg FROM access_logs').get() as any).avg

  const dist = conn.prepare(`
    SELECT
      SUM(CASE WHEN duration_ms < 5 THEN 1 ELSE 0 END) as d1,
      SUM(CASE WHEN duration_ms >= 5 AND duration_ms < 10 THEN 1 ELSE 0 END) as d2,
      SUM(CASE WHEN duration_ms >= 10 AND duration_ms < 25 THEN 1 ELSE 0 END) as d3,
      SUM(CASE WHEN duration_ms >= 25 AND duration_ms < 50 THEN 1 ELSE 0 END) as d4,
      SUM(CASE WHEN duration_ms >= 50 AND duration_ms < 100 THEN 1 ELSE 0 END) as d5,
      SUM(CASE WHEN duration_ms >= 100 AND duration_ms < 200 THEN 1 ELSE 0 END) as d6,
      SUM(CASE WHEN duration_ms >= 200 THEN 1 ELSE 0 END) as d7
    FROM access_logs
  `).get() as any

  // Requests per minute from time range
  const range = conn
    .prepare("SELECT MIN(timestamp) as first, MAX(timestamp) as last FROM access_logs WHERE timestamp != ''")
    .get() as { first: string | null; last: string | null }

  let requestsPerMinute = 0
  if (range.first && range.last) {
    const rangeMs = new Date(range.last).getTime() - new Date(range.first).getTime()
    requestsPerMinute = Math.round((total / Math.max(rangeMs / 60_000, 1)) * 100) / 100
  }

  // Hourly breakdown for time-series charts (last 24h)
  const hourly = conn
    .prepare(
      `SELECT strftime('%H', timestamp) as hour, COUNT(*) as count,
              ROUND(AVG(duration_ms), 1) as avg_latency
       FROM access_logs
       WHERE timestamp >= datetime('now', '-24 hours')
       GROUP BY strftime('%H', timestamp)
       ORDER BY hour`,
    )
    .all() as { hour: string; count: number; avg_latency: number }[]

  const requestsByHour = Array.from({ length: 24 }, (_, i) => {
    const h = String(i).padStart(2, '0')
    const row = hourly.find((r) => r.hour === h)
    return { hour: `${i}h`, count: row?.count ?? 0 }
  })

  const latencyByHour = Array.from({ length: 24 }, (_, i) => {
    const h = String(i).padStart(2, '0')
    const row = hourly.find((r) => r.hour === h)
    return { hour: `${i}h`, avgLatency: row?.avg_latency ?? 0 }
  })

  return {
    totalRequests: total,
    statusBreakdown: {
      '2xx': statusBreakdown.s2xx || 0,
      '3xx': statusBreakdown.s3xx || 0,
      '4xx': statusBreakdown.s4xx || 0,
      '5xx': statusBreakdown.s5xx || 0,
    },
    avgLatencyMs: avgLat ? (avgLat as number).toFixed(1) : '0',
    errorRate: total > 0 ? Math.round(((statusBreakdown.s5xx || 0) / total) * 1000) / 10 : 0,
    requestsPerMinute,
    requestsByHour,
    latencyByHour,
    latencyDist: [
      { bucket: '0-5ms', count: dist.d1 || 0 },
      { bucket: '5-10ms', count: dist.d2 || 0 },
      { bucket: '10-25ms', count: dist.d3 || 0 },
      { bucket: '25-50ms', count: dist.d4 || 0 },
      { bucket: '50-100ms', count: dist.d5 || 0 },
      { bucket: '100-200ms', count: dist.d6 || 0 },
      { bucket: '200ms+', count: dist.d7 || 0 },
    ],
  }
}

// Full analytics payload for the /api/analytics endpoint.
// Runs every query in a single DB call via SQL aggregations — no in-memory loops.
export function getAnalytics() {
  const conn = getDb()

  const total = (
    conn.prepare('SELECT COUNT(*) as n FROM access_logs').get() as { n: number }
  ).n

  if (total === 0) {
    return {
      totalRequests: 0,
      statusBreakdown: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
      topPaths: [] as { path: string; count: number }[],
      topHosts: [] as { host: string; count: number }[],
      avgLatencyMs: 0,
      requestsPerMinute: 0,
    }
  }

  const statusBreakdown = conn
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN status >= 200 AND status < 300 THEN 1 ELSE 0 END), 0) as s2xx,
        COALESCE(SUM(CASE WHEN status >= 300 AND status < 400 THEN 1 ELSE 0 END), 0) as s3xx,
        COALESCE(SUM(CASE WHEN status >= 400 AND status < 500 THEN 1 ELSE 0 END), 0) as s4xx,
        COALESCE(SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END), 0) as s5xx
      FROM access_logs`,
    )
    .get() as { s2xx: number; s3xx: number; s4xx: number; s5xx: number }

  const avgLatencyMs = Math.round(
    ((conn
      .prepare('SELECT AVG(duration_ms) as v FROM access_logs')
      .get() as { v: number | null }).v ?? 0) * 100,
  ) / 100

  const topPaths = (
    conn
      .prepare(
        'SELECT path, COUNT(*) as count FROM access_logs GROUP BY path ORDER BY count DESC LIMIT 10',
      )
      .all() as { path: string; count: number }[]
  ).map((r) => ({ path: r.path.length > 60 ? r.path.slice(0, 60) + '…' : r.path, count: r.count }))

  const topHosts = (
    conn
      .prepare(
        'SELECT host, COUNT(*) as count FROM access_logs GROUP BY host ORDER BY count DESC LIMIT 10',
      )
      .all() as { host: string; count: number }[]
  ).map((r) => ({ host: r.host || '—', count: r.count }))

  // Requests per minute = total / time range in minutes
  const range = conn
    .prepare(
      "SELECT MIN(timestamp) as first, MAX(timestamp) as last FROM access_logs WHERE timestamp != ''",
    )
    .get() as { first: string | null; last: string | null }

  let requestsPerMinute = 0
  if (range.first && range.last) {
    const rangeMs =
      new Date(range.last).getTime() - new Date(range.first).getTime()
    const rangeMinutes = Math.max(rangeMs / 60_000, 1)
    requestsPerMinute = Math.round((total / rangeMinutes) * 100) / 100
  } else {
    requestsPerMinute = total
  }

  return {
    totalRequests: total,
    statusBreakdown: {
      '2xx': statusBreakdown.s2xx,
      '3xx': statusBreakdown.s3xx,
      '4xx': statusBreakdown.s4xx,
      '5xx': statusBreakdown.s5xx,
    },
    topPaths,
    topHosts,
    avgLatencyMs,
    requestsPerMinute,
  }
}

// ── Geo traffic for the map ───────────────────────────────────

/** Returns the top unique IPs from recent logs for GeoIP resolution. */
export function getRecentClientIPs(limit = 500): string[] {
  const conn = getDb()
  const rows = conn
    .prepare('SELECT DISTINCT client_ip FROM access_logs ORDER BY id DESC LIMIT ?')
    .all(limit) as { client_ip: string }[]
  return rows.map((r) => r.client_ip).filter(Boolean)
}

/**
 * Returns country-level traffic counts from cached GeoIP data.
 * Caller should pass pre-resolved `{ ip: countryCode }` map.
 */
export function getTrafficByCountry(ipCountryMap: Record<string, string>): Record<string, number> {
  const conn = getDb()
  const rows = conn
    .prepare('SELECT client_ip FROM (SELECT DISTINCT client_ip FROM access_logs ORDER BY id DESC LIMIT 1000)')
    .all() as { client_ip: string }[]

  const countryCounts: Record<string, number> = {}
  for (const { client_ip } of rows) {
    const country = ipCountryMap[client_ip]
    if (country) {
      countryCounts[country] = (countryCounts[country] || 0) + 1
    }
  }
  return countryCounts
}
