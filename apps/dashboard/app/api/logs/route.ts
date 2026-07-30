import { NextRequest, NextResponse } from 'next/server'
import { insertLogs, queryLogs } from '@/lib/logdb'

const AGENT_API = process.env.AGENT_API_URL
const AGENT_TOKEN = process.env.AGENT_API_TOKEN

if (!AGENT_API) throw new Error('Missing AGENT_API_URL')
if (!AGENT_TOKEN) throw new Error('Missing AGENT_API_TOKEN')

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams
  const method = s.get('method')
  const status = s.get('status')
  const path = s.get('path')
  const limit = s.get('limit') ?? '500'
  const offset = s.get('offset') ?? '0'

  // Try to fetch fresh logs from agent
  try {
    const res = await fetch(`${AGENT_API}/api/logs/access?limit=${limit}`, {
      headers: { Authorization: `Bearer ${AGENT_TOKEN}` },
      cache: 'no-store',
    })

    if (res.ok) {
      const data = await res.json()
      const logs = data.logs ?? []

      // Persist to SQLite in background
      if (logs.length > 0) {
        try { insertLogs(logs) } catch { /* non-blocking */ }
      }

      // Return fresh data
      const result = queryLogs({ method: method || undefined, status: status || undefined, path: path || undefined, limit: 100, offset: Number(offset) })
      return NextResponse.json(result)
    }
  } catch { /* fall through to DB */ }

  // Fallback: serve from SQLite
  try {
    const result = queryLogs({ method: method || undefined, status: status || undefined, path: path || undefined, limit: 100, offset: Number(offset) })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Agent and DB unreachable' }, { status: 502 })
  }
}
