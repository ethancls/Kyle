import { NextResponse } from 'next/server'
import { getServices } from '@/lib/traefik'

export async function GET() {
  try {
    const services = await getServices()
    return NextResponse.json({ services, total: services.length })
  } catch (err) {
    console.error('[api/traefik] getServices failed:', err)
    return NextResponse.json(
      { error: 'Agent unreachable' },
      { status: 502 },
    )
  }
}
