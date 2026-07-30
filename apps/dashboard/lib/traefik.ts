import { cache } from 'react'
import type { ServiceInfo } from '@lens/shared'

const AGENT_API = process.env.AGENT_API_URL
const AGENT_TOKEN = process.env.AGENT_API_TOKEN

if (!AGENT_API) throw new Error('Missing AGENT_API_URL')
if (!AGENT_TOKEN) throw new Error('Missing AGENT_API_TOKEN')

function headers() {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (AGENT_TOKEN) h.Authorization = `Bearer ${AGENT_TOKEN}`
  return h
}

export const getServices = cache(async (): Promise<ServiceInfo[]> => {
  const res = await fetch(`${AGENT_API}/api/services/list`, {
    headers: headers(),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Agent returned ${res.status}`)
  }

  const data = await res.json()

  return (data.services as any[])
    .map((svc) => ({
      id: svc.id,
      name: svc.name,
      status: svc.status === 'running' ? ('running' as const) : ('stopped' as const),
      containerId: svc.url?.replace(/^https?:\/\//, '') ?? '',
      uptime: '--',
      cpuPercent: 0,
      memoryPercent: 0,
      requestsPerSecond: 0,
      avgLatencyMs: 0,
      url: svc.url ?? '-',
      hostname: svc.hostname ?? undefined,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

export async function restartService(name: string) {
  await fetch(`${AGENT_API}/api/services/restart`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ service: name }),
  })
}

export async function stopService(name: string) {
  await fetch(`${AGENT_API}/api/services/stop`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ service: name }),
  })
}

export async function startService(name: string) {
  await fetch(`${AGENT_API}/api/services/start`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ service: name }),
  })
}
