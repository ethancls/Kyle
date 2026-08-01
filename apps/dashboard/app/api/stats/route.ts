import { NextResponse } from 'next/server'
import { getStats } from '@/lib/logdb'

/**
 * GET /api/stats
 *
 * Pure SQLite reader — returns aggregated dashboard stats.
 * The Dashboard server component handles all log syncing.
 */
export async function GET() {
  try {
    const stats = getStats()
    return NextResponse.json(stats)
  } catch (err) {
    console.error('[api/stats] getStats failed:', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
