'use client'

import { useMap } from 'react-leaflet'

export function MapReset() {
  const map = useMap()

  return (
    <button
      type="button"
      onClick={() => map.setView([25, 0], 2, { animate: true })}
      className="absolute bottom-[112px] left-[10px] z-[1000] w-[30px] h-[30px] flex items-center justify-center
                 bg-surface border-2 border-[rgba(0,0,0,0.2)] rounded-md
                 text-text-primary hover:bg-surface-raised cursor-pointer text-sm"
      title="Reset view"
    >
      ⌂
    </button>
  )
}
