import { NextRequest, NextResponse } from 'next/server'
import { queryLogs } from '@/lib/logdb'

/**
 * GET /api/logs/history
 *
 * Pure SQLite reader — returns persisted logs with server-side filters
 * and pagination. No agent calls, no side effects.
 *
 * Query params:
 *   ?method=GET&status=4xx&path=/api&limit=100&offset=0
 */
export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams
  const method = s.get('method') || undefined
  const status = s.get('status') || undefined
  const path = s.get('path') || undefined
  const limit = Math.min(Number(s.get('limit') ?? '100'), 1000)
  const offset = Math.max(Number(s.get('offset') ?? '0'), 0)

  try {
    const result = queryLogs({ method, status, path, limit, offset })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[api/logs/history] DB query failed:', err)
    return NextResponse.json({ logs: [], total: 0, error: 'DB error' }, { status: 500 })
  }
}
