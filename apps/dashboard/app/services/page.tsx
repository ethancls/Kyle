import type { Metadata } from 'next'
import { getServices } from '@/lib/traefik'
import { ServicesClient } from '@/components/services/client'

export const metadata: Metadata = {
  title: 'Services',
}

export default async function ServicesPage() {
  let services: Awaited<ReturnType<typeof getServices>> = []
  let error: string | null = null

  try {
    services = await getServices()
  } catch (err) {
    console.error('[services/page] getServices failed:', err)
    error = 'Failed to connect to Traefik API at localhost:8080'
  }

  return <ServicesClient initialServices={services} initialError={error} />
}
