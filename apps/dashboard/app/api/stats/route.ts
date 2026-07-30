import { NextResponse } from 'next/server'
import { getStats, insertLogs } from '@/lib/logdb'

const AGENT_API = process.env.AGENT_API_URL
const AGENT_TOKEN = process.env.AGENT_API_TOKEN

export async function GET() {
  // Sync: fetch fresh logs from agent, insert into SQLite
  if (AGENT_API && AGENT_TOKEN) {
    try {
      const res = await fetch(`${AGENT_API}/api/logs/access?limit=2000&position=0`, {
        headers: { Authorization: `Bearer ${AGENT_TOKEN}` },
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        const logs = data.logs ?? []
        if (logs.length > 0) insertLogs(logs)
      }
    } catch { /* agent unreachable */ }
  }

  // Return stats from SQLite
  try {
    const stats = getStats()
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
