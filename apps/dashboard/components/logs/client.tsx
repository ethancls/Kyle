'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { ArrowCounterClockwise, MagnifyingGlass } from '@phosphor-icons/react'
import { cn } from '@lens/ui'

interface LogEntry {
  time: string
  RequestMethod: string
  RequestPath: string
  DownstreamStatus: number
  ClientHost: string
  Duration: number
  RequestHost: string
  RouterName: string
  [key: string]: unknown
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-blue-400',
  POST: 'text-green-400',
  PUT: 'text-yellow-400',
  DELETE: 'text-red-400',
  HEAD: 'text-text-muted',
  PATCH: 'text-accent-purple',
  OPTIONS: 'text-text-muted',
}

function statusColor(s: number): string {
  if (s >= 200 && s < 300) return 'text-accent-teal'
  if (s >= 300 && s < 400) return 'text-accent-orange'
  return 'text-accent-red'
}

function methodColor(m: string): string {
  return METHOD_COLORS[m] ?? 'text-text-secondary'
}

function formatTime(iso: string): string {
  if (!iso) return '--'
  const idx = iso.indexOf('T')
  if (idx === -1) return iso
  // Return HH:MM:SS portion
  const timePart = iso.slice(idx + 1)
  return timePart.replace('Z', '').slice(0, 8)
}

function formatLatency(durationNs: number): string {
  if (!durationNs) return '--'
  const ms = Number(durationNs) / 1_000_000
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  if (ms >= 1) return `${ms.toFixed(1)}ms`
  return `${(ms * 1000).toFixed(0)}μs`
}

export function LogsClient() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchLogs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams({ limit: '500' })
      if (methodFilter) params.set('method', methodFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (query) params.set('path', query)

      const res = await fetch(`/api/logs?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs((data.logs as LogEntry[]) ?? [])
      setError(null)
    } catch {
      setError('Failed to fetch logs')
    }
    setLoading(false)
    setRefreshing(false)
  }, [methodFilter, statusFilter, query])

  // Initial fetch + auto-refresh every 10s
  useEffect(() => {
    fetchLogs()
    const interval = setInterval(() => fetchLogs(true), 10_000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  // Client-side filtering (secondary filter for text search in case API doesn't support it)
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (query && !l.RequestPath?.toLowerCase().includes(query.toLowerCase()) && !l.ClientHost?.toLowerCase().includes(query.toLowerCase())) return false
      if (methodFilter && l.RequestMethod !== methodFilter) return false
      if (statusFilter) {
        const s = l.DownstreamStatus
        const prefix = statusFilter === '2xx' ? 2 : statusFilter === '3xx' ? 3 : statusFilter === '4xx' ? 4 : statusFilter === '5xx' ? 5 : 0
        if (prefix) {
          if (s < prefix * 100 || s >= (prefix + 1) * 100) return false
        }
      }
      return true
    })
  }, [logs, query, methodFilter, statusFilter])

  const isEmpty = !loading && logs.length === 0
  const noMatches = logs.length > 0 && filtered.length === 0

  return (
    <div className="bg-surface rounded-xl ring-1 ring-black/[0.07] dark:ring-white/10">
      {/* Filters toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-border/50">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search path or IP..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-[38px] pl-9 pr-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10
                       text-sm text-text-primary placeholder:text-text-muted
                       focus:outline-none focus:ring-primary/50"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="h-[38px] px-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10
                     text-sm text-text-primary focus:outline-none focus:ring-primary/50"
        >
          <option value="">All methods</option>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
          <option>HEAD</option>
          <option>PATCH</option>
          <option>OPTIONS</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-[38px] px-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10
                     text-sm text-text-primary focus:outline-none focus:ring-primary/50"
        >
          <option value="">All status</option>
          <option value="2xx">2xx Success</option>
          <option value="3xx">3xx Redirect</option>
          <option value="4xx">4xx Client Error</option>
          <option value="5xx">5xx Server Error</option>
        </select>

        <button
          onClick={() => fetchLogs(true)}
          className="h-[38px] px-3 rounded-lg text-sm text-text-secondary hover:text-text-primary
                     hover:bg-surface-raised ring-1 ring-black/[0.07] dark:ring-white/10 transition-all shrink-0
                     flex items-center gap-1.5"
        >
          <ArrowCounterClockwise
            weight="duotone"
            className={cn('w-4 h-4', refreshing && 'animate-spin [animation-direction:reverse]')}
          />
          <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>

        <span className="text-xs text-text-muted ml-auto tabular-nums">
          {loading ? '...' : `${filtered.length} entries`}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 text-sm text-accent-red">
          {error} — ensure the agent is running on port 5000
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider w-[100px]">
                Time
              </th>
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider w-[75px]">
                Method
              </th>
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider">
                Path
              </th>
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider w-[65px]">
                Status
              </th>
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider hidden md:table-cell">
                IP
              </th>
              <th className="text-right py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider w-[85px] hidden sm:table-cell">
                Latency
              </th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-text-muted">
                  <p className="text-sm">No requests yet</p>
                  <p className="text-xs mt-1 text-text-muted/60">
                    Requests to your Traefik proxy will appear here
                  </p>
                </td>
              </tr>
            ) : noMatches ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-text-muted text-sm">
                  No matching entries — try adjusting your filters
                </td>
              </tr>
            ) : (
              filtered.map((l, i) => (
                <tr
                  key={`${l.time}-${i}`}
                  className="border-b border-border/30 hover:bg-surface-raised/50 transition-colors"
                >
                  <td className="py-2.5 px-4 text-text-muted font-mono text-xs whitespace-nowrap">
                    {formatTime(l.time)}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={cn('text-xs font-mono font-semibold tracking-wide', methodColor(l.RequestMethod))}>
                      {l.RequestMethod}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-text-primary font-mono text-xs max-w-[300px] truncate">
                    {l.RequestPath}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={cn('text-xs font-mono font-semibold', statusColor(l.DownstreamStatus))}>
                      {l.DownstreamStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-text-secondary font-mono text-xs hidden md:table-cell whitespace-nowrap">
                    {l.ClientHost?.split(',')[0]?.trim() ?? '--'}
                  </td>
                  <td className="py-2.5 px-4 text-text-muted font-mono text-xs text-right hidden sm:table-cell whitespace-nowrap tabular-nums">
                    {formatLatency(l.Duration)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
