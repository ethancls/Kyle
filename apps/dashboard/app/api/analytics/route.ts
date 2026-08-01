import { NextResponse } from 'next/server'
import { getAnalytics } from '@/lib/logdb'

/**
 * GET /api/analytics
 *
 * Pure SQLite reader — returns pre-aggregated analytics.
 * The Dashboard server component handles all log syncing.
 * No agent calls, no side effects.
 */
export async function GET() {
  try {
    return NextResponse.json(getAnalytics())
  } catch (err) {
    console.error('[api/analytics] DB query failed:', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
