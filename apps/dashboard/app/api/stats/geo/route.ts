import { NextResponse } from 'next/server'
import { getRecentClientIPs, getTrafficByCountry } from '@/lib/logdb'

const COUNTRY_CACHE: Record<string, string> = {}

/** Resolves a batch of IPs to country codes via ip-api.com (batch endpoint). */
async function resolveCountries(ips: string[]): Promise<Record<string, string>> {
  const uncached = ips.filter((ip) => !COUNTRY_CACHE[ip])
  if (uncached.length === 0) return COUNTRY_CACHE

  // Resolve in parallel with batching (ip-api allows batch via POST)
  const results = await Promise.all(
    uncached.map(async (ip) => {
      try {
        const res = await fetch(`http://ip-api.com/json/${ip}`, {
          headers: { 'User-Agent': 'kyle-dashboard/1.0' },
          signal: AbortSignal.timeout(3000),
        })
        if (!res.ok) return { ip, code: null }
        const data = await res.json()
        const code = data.countryCode
        if (code) COUNTRY_CACHE[ip] = code
        return { ip, code: code || null }
      } catch {
        return { ip, code: null }
      }
    }),
  )

  return COUNTRY_CACHE
}

/** Country code → display name (subset for labels). */
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', FR: 'France', GB: 'United Kingdom', DE: 'Germany',
  JP: 'Japan', NL: 'Netherlands', SG: 'Singapore', CA: 'Canada',
  AU: 'Australia', BR: 'Brazil', RU: 'Russia', IN: 'India',
  KR: 'South Korea', SE: 'Sweden', CN: 'China', IT: 'Italy',
  ES: 'Spain', CH: 'Switzerland', BE: 'Belgium', PL: 'Poland',
  NO: 'Norway', DK: 'Denmark', FI: 'Finland', IE: 'Ireland',
  AT: 'Austria', PT: 'Portugal', CZ: 'Czechia', RO: 'Romania',
  UA: 'Ukraine', TR: 'Turkey', IR: 'Iran', VN: 'Vietnam',
  TH: 'Thailand', ID: 'Indonesia', MY: 'Malaysia', PH: 'Philippines',
  NZ: 'New Zealand', ZA: 'South Africa', MX: 'Mexico', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia', NG: 'Nigeria', KE: 'Kenya',
  EG: 'Egypt', IL: 'Israel', AE: 'UAE', SA: 'Saudi Arabia',
  HK: 'Hong Kong', TW: 'Taiwan',
}

/**
 * GET /api/stats/geo
 *
 * Returns country-level traffic counts for the dashboard map.
 * Caches GeoIP lookups server-side to avoid hitting ip-api on every poll.
 */
export async function GET() {
  try {
    const ips = getRecentClientIPs(500)
    await resolveCountries(ips)
    const counts = getTrafficByCountry(COUNTRY_CACHE)

    // Convert to country data with labels
    const countries = Object.entries(counts)
      .map(([code, req]) => ({
        code,
        label: COUNTRY_NAMES[code] ?? code,
        req,
      }))
      .sort((a, b) => b.req - a.req)

    return NextResponse.json({ countries, maxTraffic: countries[0]?.req ?? 0 })
  } catch (err) {
    console.error('[api/stats/geo] lookup failed:', err)
    return NextResponse.json({ countries: [], maxTraffic: 0 }, { status: 500 })
  }
}
