import { NextRequest, NextResponse } from 'next/server'

const GEO_PROVIDER = 'http://ip-api.com/json'

export async function GET(req: NextRequest) {
  const ip = req.nextUrl.searchParams.get('ip')
  if (!ip) {
    return NextResponse.json({ error: 'Missing ?ip= parameter' }, { status: 400 })
  }

  try {
    const res = await fetch(`${GEO_PROVIDER}/${ip}`, {
      headers: { 'User-Agent': 'kyle-dashboard/1.0' },
      signal: AbortSignal.timeout(3000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'GeoIP service error' }, { status: 502 })
    }

    const data = await res.json()

    return NextResponse.json({
      ip,
      country: data.country ?? 'Unknown',
      countryCode: data.countryCode ?? 'XX',
      city: data.city ?? undefined,
      lat: data.lat ?? undefined,
      lng: data.lon ?? undefined,
    })
  } catch {
    return NextResponse.json({ error: 'GeoIP unreachable' }, { status: 502 })
  }
}
