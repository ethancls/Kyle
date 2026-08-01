/**
 * Centralized agent API client.
 *
 * Every server-side fetch to the Go agent goes through this module.
 * Browser code should never call the agent directly — use API routes instead.
 */

const AGENT_API = process.env.AGENT_API_URL ?? ''
const AGENT_TOKEN = process.env.AGENT_API_TOKEN ?? ''

function requireConfig(): { api: string; token: string } {
  if (!AGENT_API) throw new AgentError(0, 'Missing AGENT_API_URL — set in .env.local')
  if (!AGENT_TOKEN) throw new AgentError(0, 'Missing AGENT_API_TOKEN — set in .env.local')
  return { api: AGENT_API, token: AGENT_TOKEN }
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  requireConfig()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AGENT_TOKEN}`,
    ...extra,
  }
}

/**
 * Typed fetch to the Go agent. Throws on non-ok responses, network errors, or timeout.
 * Default 10s timeout prevents hanging during build or when agent is unreachable.
 */
export async function agentFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const signal = AbortSignal.timeout(10_000)

  const res = await fetch(`${AGENT_API}${path}`, {
    ...init,
    signal,
    headers: {
      ...authHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  })

  if (!res.ok) {
    throw new AgentError(res.status, res.statusText)
  }

  return res.json() as Promise<T>
}

export class AgentError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(`Agent ${status}: ${message}`)
    this.name = 'AgentError'
    this.status = status
  }
}

// ── Service helpers ────────────────────────────────────────────

import type { ServiceInfo } from '@kyle/shared'
import { cache } from 'react'

export const getServices = cache(async (): Promise<ServiceInfo[]> => {
  const data = await agentFetch<{ services: any[] }>('/api/services/list')

  return (data.services ?? [])
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
  await agentFetch('/api/services/restart', {
    method: 'POST',
    body: JSON.stringify({ service: name }),
  })
}

export async function stopService(name: string) {
  await agentFetch('/api/services/stop', {
    method: 'POST',
    body: JSON.stringify({ service: name }),
  })
}

export async function startService(name: string) {
  await agentFetch('/api/services/start', {
    method: 'POST',
    body: JSON.stringify({ service: name }),
  })
}

// ── Log sync ───────────────────────────────────────────────────

// Coalesced sync singleton — prevents duplicate concurrent agent fetches.
// Multiple callers can call ensureRecentSync() simultaneously and only
// one HTTP request to the agent will be made. After a sync completes,
// subsequent calls within SYNC_TTL_MS return immediately.
let pendingSync: Promise<void> | null = null
let lastSyncAt = 0
const SYNC_TTL_MS = 3_000
const SYNC_LIMIT = 2_000

/**
 * Ensures SQLite has recent log data from the agent.
 * Multiple concurrent callers share a single agent fetch.
 * Skips if a sync completed within the last 3 seconds.
 *
 * Called by the Dashboard server component (the single sync trigger).
 * API routes should NOT call this — they are pure SQLite readers.
 */
export async function ensureRecentSync(limit = SYNC_LIMIT): Promise<void> {
  const now = Date.now()

  // If a sync is already in flight, wait for it
  if (pendingSync) {
    await pendingSync
    // If it completed recently, don't re-sync
    if (now - lastSyncAt < SYNC_TTL_MS) return
  }

  // If last sync was recent enough, skip entirely
  if (now - lastSyncAt < SYNC_TTL_MS) return

  pendingSync = (async () => {
    const data = await agentFetch<{ logs: any[] }>(
      `/api/logs/access?limit=${limit}&position=0`,
    )

    if (data.logs && data.logs.length > 0) {
      const { insertLogs } = await import('@/lib/logdb')
      insertLogs(data.logs)
    }

    lastSyncAt = Date.now()
  })()

  try {
    await pendingSync
  } finally {
    pendingSync = null
  }
}
