'use client'

import { useEffect, useState } from 'react'
import { MapContainer, GeoJSON, ZoomControl } from 'react-leaflet'
import { MapReset } from './map-reset'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const countryTraffic: Record<string, { req: number; label: string }> = {
  USA: { req: 156, label: 'United States' },
  FRA: { req: 142, label: 'France' },
  GBR: { req: 128, label: 'United Kingdom' },
  DEU: { req: 110, label: 'Germany' },
  JPN: { req: 95, label: 'Japan' },
  NLD: { req: 80, label: 'Netherlands' },
  SGP: { req: 65, label: 'Singapore' },
  CAN: { req: 55, label: 'Canada' },
  AUS: { req: 48, label: 'Australia' },
  BRA: { req: 42, label: 'Brazil' },
  RUS: { req: 35, label: 'Russia' },
  IND: { req: 30, label: 'India' },
  KOR: { req: 25, label: 'South Korea' },
  SWE: { req: 20, label: 'Sweden' },
}
const maxTraffic = Math.max(...Object.values(countryTraffic).map(c => c.req))

function getCountryFill(req: number): string {
  if (req <= 0) return '#1A1A1A'
  const t = req / maxTraffic
  const r = Math.round(0x66 - (0x66 - 0x1E) * t)
  const g = Math.round(0x88 - (0x88 - 0x40) * t)
  const b = Math.round(0xFF - (0xFF - 0xAF) * t)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

function TimeFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { value: '1h', label: 'Last hour' },
    { value: '24h', label: 'Last 24h' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
  ]
  return (
    <div className="flex items-center gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            value === o.value
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Legend() {
  return (
    <div className="bg-surface/90 backdrop-blur rounded-lg px-3 py-2 text-xs border border-border/50">
      <div className="text-text-secondary mb-1.5 font-medium">Traffic Intensity</div>
      <div className="h-2 w-32 rounded" style={{ background: 'linear-gradient(to right, #DBEAFE, #1E40AF)' }} />
      <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
        <span>0</span>
        <span>{maxTraffic} req</span>
      </div>
    </div>
  )
}

export default function MapClient() {
  const [geoData, setGeoData] = useState<any>(null)
  const [timeRange, setTimeRange] = useState('24h')

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(r => r.json())
      .then(setGeoData)
  }, [])

  const style = (feature: any) => {
    const iso = feature?.properties?.ISO_A3
    const c = iso ? countryTraffic[iso] : null
    return {
      fillColor: getCountryFill(c ? c.req : 0),
      weight: 0.3,
      color: '#333',
      opacity: 0.4,
      fillOpacity: 1,
    }
  }

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const iso = feature?.properties?.ISO_A3
    const c = iso ? countryTraffic[iso] : null
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
      <div className="absolute top-4 left-4 z-[1000]">
        <TimeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="absolute bottom-6 right-3 z-[1000]">
        <Legend />
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
