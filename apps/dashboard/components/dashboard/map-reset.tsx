'use client'

import { useMap } from 'react-leaflet'
import { Crosshair } from '@phosphor-icons/react'

export function MapReset() {
  const map = useMap()

  return (
    <div className="leaflet-bottom leaflet-left" style={{ marginBottom: '80px' }}>
      <div className="leaflet-control">
        <button
          type="button"
          onClick={() => map.setView([25, 0], 2, { animate: true })}
          className="w-[30px] h-[30px] flex items-center justify-center
                     bg-surface text-text-secondary hover:text-text-primary
                     border-2 border-[rgba(0,0,0,0.2)] rounded-md
                     hover:bg-surface-raised cursor-pointer transition-colors"
          title="Reset view"
          aria-label="Reset map view"
        >
          <Crosshair weight="bold" className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
