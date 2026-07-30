import { NextRequest, NextResponse } from 'next/server'

const AGENT_API = process.env.AGENT_API_URL
const AGENT_TOKEN = process.env.AGENT_API_TOKEN

if (!AGENT_API) throw new Error('Missing AGENT_API_URL')
if (!AGENT_TOKEN) throw new Error('Missing AGENT_API_TOKEN')

interface LogEntry {
  time: string
  RequestMethod: string
  RequestPath: string
  DownstreamStatus: number
  ClientHost: string
  Duration: number
  RequestHost: string
  RouterName: string
  [key: string]: unknown
}

export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get('limit') ?? '1000'

  try {
    const url = `${AGENT_API}/api/logs/access?limit=${limit}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AGENT_TOKEN}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Agent error' }, { status: 502 })
    }

    const data = await res.json()
    const logs: LogEntry[] = data.logs ?? []

    // Status breakdown
    const statusBreakdown = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 }
    for (const l of logs) {
      const s = l.DownstreamStatus
      if (s >= 200 && s < 300) statusBreakdown['2xx']++
      else if (s >= 300 && s < 400) statusBreakdown['3xx']++
      else if (s >= 400 && s < 500) statusBreakdown['4xx']++
      else if (s >= 500) statusBreakdown['5xx']++
    }

    // Top paths
    const pathCounts = new Map<string, number>()
    for (const l of logs) {
      const p = l.RequestPath ?? '/'
      pathCounts.set(p, (pathCounts.get(p) ?? 0) + 1)
    }
    const topPaths = Array.from(pathCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top hosts
    const hostCounts = new Map<string, number>()
    for (const l of logs) {
      const h = l.RequestHost || '—'
      hostCounts.set(h, (hostCounts.get(h) ?? 0) + 1)
    }
    const topHosts = Array.from(hostCounts.entries())
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Average latency (Duration is in nanoseconds)
    const totalDuration = logs.reduce(
      (sum, l) => sum + (Number(l.Duration) || 0),
      0,
    )
    const avgLatencyMs =
      logs.length > 0
        ? Math.round(totalDuration / logs.length / 1_000_000 * 100) / 100
        : 0

    // Requests per minute
    const timestamps = logs.map((l) => new Date(l.time).getTime()).filter(Boolean)
    let requestsPerMinute = 0
    if (timestamps.length > 1) {
      const rangeMs = Math.max(...timestamps) - Math.min(...timestamps)
      const rangeMinutes = Math.max(rangeMs / 60_000, 1)
      requestsPerMinute = Math.round((timestamps.length / rangeMinutes) * 100) / 100
    } else if (timestamps.length === 1) {
      requestsPerMinute = 1
    }

    return NextResponse.json({
      totalRequests: logs.length,
      statusBreakdown,
      topPaths,
      topHosts,
      avgLatencyMs,
      requestsPerMinute,
    })
  } catch {
    return NextResponse.json({ error: 'Agent unreachable' }, { status: 502 })
  }
}
