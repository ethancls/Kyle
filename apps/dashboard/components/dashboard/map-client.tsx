'use client'

import { useEffect, useState } from 'react'
import { MapContainer, GeoJSON, ZoomControl } from 'react-leaflet'
import { MapReset } from './map-reset'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface CountryData {
  code: string
  label: string
  req: number
}

function getCountryFill(req: number, maxTraffic: number): string {
  if (req <= 0 || maxTraffic <= 0) return '#1A1A1A'
  const t = req / maxTraffic
  // Blue gradient: light (#6688FF) → deep (#1E40AF)
  const [r1, g1, b1] = [0x66, 0x88, 0xFF]
  const [r2, g2, b2] = [0x1E, 0x40, 0xAF]
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function Legend({ maxTraffic }: { maxTraffic: number }) {
  return (
    <div className="bg-surface/90 backdrop-blur rounded-lg px-3 py-2 text-xs border border-border/50">
      <div className="text-text-secondary mb-1.5 font-medium">Traffic</div>
      <div
        className="h-2 w-32 rounded"
        style={{ background: 'linear-gradient(to right, #6688FF, #1E40AF)' }}
      />
      <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
        <span>0</span>
        <span>{maxTraffic} req</span>
      </div>
    </div>
  )
}

export default function MapClient() {
  const [geoData, setGeoData] = useState<any>(null)
  const [countryTraffic, setCountryTraffic] = useState<CountryData[]>([])
  const [maxTraffic, setMaxTraffic] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch GeoJSON geometry (static, cached by CDN)
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then((r) => r.json())
      .then(setGeoData)
  }, [])

  // Fetch real traffic data from SQLite + GeoIP
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/stats/geo')
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setCountryTraffic(data.countries ?? [])
        setMaxTraffic(data.maxTraffic ?? 0)
      } catch {
        /* geo unavailable — map still renders */
      }
      if (!cancelled) setLoading(false)
    }
    load()
    const interval = setInterval(load, 60_000) // refresh every 60s (GeoIP is slow)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  // Build lookup map for O(1) style access
  const trafficMap: Record<string, CountryData> = {}
  for (const c of countryTraffic) {
    trafficMap[c.code] = c
  }

  const style = (feature: any) => {
    const iso = feature?.properties?.ISO_A3
    const c = iso ? trafficMap[iso] : undefined
    return {
      fillColor: getCountryFill(c ? c.req : 0, maxTraffic),
      weight: 0.3,
      color: '#333',
      opacity: 0.4,
      fillOpacity: c ? 1 : 0.2,
    }
  }

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const iso = feature?.properties?.ISO_A3
    const c = iso ? trafficMap[iso] : undefined
    if (c) {
      layer.bindTooltip(`${c.label}: ${c.req} req`, {
        sticky: true,
        direction: 'top',
        className: 'country-tooltip',
      })
    }
  }

  return (
    <div className="w-full h-[500px] md:h-[650px] relative">
      {/* Map info overlay */}
      {!loading && (
        <div className="absolute top-4 left-4 z-[1000] text-xs text-text-muted bg-surface/80 backdrop-blur rounded-lg px-3 py-1.5 border border-border/50">
          {countryTraffic.length > 0
            ? `${countryTraffic.length} countries`
            : 'No traffic data yet'}
        </div>
      )}

      <div className="absolute bottom-6 right-3 z-[1000]">
        <Legend maxTraffic={maxTraffic} />
      </div>

      <MapContainer
        center={[25, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={8}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      >
        {geoData && (
          <GeoJSON
            data={geoData}
            style={style}
            onEachFeature={onEachFeature}
          />
        )}
        <ZoomControl position="bottomleft" />
        <MapReset />
      </MapContainer>
    </div>
  )
}
