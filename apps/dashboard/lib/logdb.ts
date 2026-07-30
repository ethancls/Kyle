import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'kyle.db')

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs')
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
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_logs_time ON access_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_status ON access_logs(status);
    `)
  }
  return db
}

// Insert logs into SQLite
export function insertLogs(logs: any[]) {
  const conn = getDb()
  const stmt = conn.prepare(`
    INSERT INTO access_logs (timestamp, method, path, status, client_ip, duration_ms, host, router, service, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insert = conn.transaction((entries: any[]) => {
    for (const l of entries) {
      const clientIp = (l.ClientHost || '').split(',')[0].trim()
      const durationMs = (l.Duration || 0) / 1_000_000

      stmt.run(
        l.StartUTC || l.StartLocal || l.time || new Date().toISOString(),
        l.RequestMethod || '',
        l.RequestPath || '',
        l.DownstreamStatus || 0,
        clientIp,
        durationMs,
        l.RequestHost || '',
        l.RouterName || '',
        l.ServiceName || '',
        JSON.stringify(l),
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

// Analytics
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
