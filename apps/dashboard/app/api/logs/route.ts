import { NextRequest, NextResponse } from 'next/server'
import { agentFetch } from '@/lib/agent'

/**
 * GET /api/logs
 *
 * Returns live access logs directly from the Go agent.
 * Also writes logs to SQLite in the background for history/analytics.
 *
 * Query params: ?limit= (default 500, max 2000)
 */
export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? '500'), 2000)

  try {
    const data = await agentFetch<{ logs: any[]; positions: any[] }>(
      `/api/logs/access?limit=${limit}&position=0`,
    )

    // Non-blocking background sync to SQLite
    if (data.logs && data.logs.length > 0) {
      import('@/lib/logdb')
        .then(({ insertLogs }) => insertLogs(data.logs))
        .catch((err) => console.error('[api/logs] background sync failed:', err))
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/logs] agent fetch failed:', err)
    return NextResponse.json({ logs: [], error: 'Agent unreachable' }, { status: 502 })
  }
}
