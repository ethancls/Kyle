'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MapClient = dynamic(() => import('./map-client'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] md:h-[650px]" />,
})

export function DashboardMap() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="w-full h-[500px] md:h-[650px]" />
  return <MapClient />
}
