'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  ArrowCounterClockwise,
  MagnifyingGlass,
  ClockCounterClockwise,
  Lightning,
} from '@phosphor-icons/react'
import { cn } from '@kyle/ui'

interface LogEntry {
  time: string
  RequestMethod: string
  RequestPath: string
  DownstreamStatus: number
  ClientHost: string
  Duration: number
  RequestHost: string
  RouterName: string
  ServiceName?: string
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

type Mode = 'live' | 'history'

export function LogsClient() {
  // ── Mode toggle ─────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('live')

  // ── Live state (agent data, client-side search only) ────────
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [liveLoading, setLiveLoading] = useState(true)
  const [liveRefreshing, setLiveRefreshing] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // ── History state (SQLite, server-side filters + pagination) ─
  const [historyLogs, setHistoryLogs] = useState<LogEntry[]>([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  // ── Fetch live logs from agent ───────────────────────────────
  const fetchLive = useCallback(async (showRefresh = false) => {
    if (showRefresh) setLiveRefreshing(true)
    else setLiveLoading(true)

    try {
      const res = await fetch('/api/logs?limit=500')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs((data.logs as LogEntry[]) ?? [])
      setLiveError(null)
    } catch (err) {
      console.error('[LogsClient] live fetch failed:', err)
      setLiveError('Cannot reach agent')
    }
    setLiveLoading(false)
    setLiveRefreshing(false)
  }, [])

  useEffect(() => {
    if (mode !== 'live') return
    fetchLive()
    const interval = setInterval(() => fetchLive(true), 10_000)
    return () => clearInterval(interval)
  }, [mode, fetchLive])

  // ── Fetch history from SQLite ────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) })
      if (methodFilter) params.set('method', methodFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('path', search)

      const res = await fetch(`/api/logs/history?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setHistoryLogs((data.logs as LogEntry[]) ?? [])
      setHistoryTotal((data.total as number) ?? 0)
      setHistoryError(null)
    } catch (err) {
      console.error('[LogsClient] history fetch failed:', err)
      setHistoryError('Failed to load history')
    }
    setHistoryLoading(false)
  }, [page, methodFilter, statusFilter, search])

  useEffect(() => {
    if (mode !== 'history') return
    fetchHistory()
  }, [mode, page, methodFilter, statusFilter, search, fetchHistory])

  // Reset page when filters change in history mode
  const setFilters = useCallback((method: string, status: string) => {
    setMethodFilter(method)
    setStatusFilter(status)
    setPage(0)
  }, [])

  // ── Client-side filtering for live mode ──────────────────────
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        l.RequestPath?.toLowerCase().includes(q) ||
        l.ClientHost?.toLowerCase().includes(q) ||
        l.RequestHost?.toLowerCase().includes(q)
      )
    })
  }, [logs, search])

  // ── Derived states ───────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE))
  const isEmpty = !liveLoading && logs.length === 0
  const noMatches = logs.length > 0 && filtered.length === 0
  const isLoading = mode === 'live' ? liveLoading : historyLoading

  return (
    <div className="bg-surface rounded-xl ring-1 ring-black/[0.07] dark:ring-white/10">
      {/* Mode toggle + toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-border/50">
        {/* Mode tabs */}
        <div className="flex items-center rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10 p-0.5">
          <button
            onClick={() => setMode('live')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              mode === 'live'
                ? 'bg-surface-raised text-text-primary'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            <Lightning weight="duotone" className="w-3.5 h-3.5" />
            Live
          </button>
          <button
            onClick={() => setMode('history')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              mode === 'history'
                ? 'bg-surface-raised text-text-primary'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            <ClockCounterClockwise weight="duotone" className="w-3.5 h-3.5" />
            History
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search path, IP, or host..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); if (mode === 'history') setPage(0) }}
            className="w-full h-[38px] pl-9 pr-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10
                       text-sm text-text-primary placeholder:text-text-muted
                       focus:outline-none focus:ring-primary/50"
          />
        </div>

        {/* Server-side filters (history mode only) */}
        {mode === 'history' && (
          <>
            <select
              value={methodFilter}
              onChange={(e) => setFilters(e.target.value, statusFilter)}
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
              onChange={(e) => setFilters(methodFilter, e.target.value)}
              className="h-[38px] px-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10
                         text-sm text-text-primary focus:outline-none focus:ring-primary/50"
            >
              <option value="">All status</option>
              <option value="2xx">2xx Success</option>
              <option value="3xx">3xx Redirect</option>
              <option value="4xx">4xx Client Error</option>
              <option value="5xx">5xx Server Error</option>
            </select>
          </>
        )}

        {/* Refresh (live mode) / refetch (history mode) */}
        <button
          onClick={() => (mode === 'live' ? fetchLive(true) : fetchHistory())}
          className="h-[38px] px-3 rounded-lg text-sm text-text-secondary hover:text-text-primary
                     hover:bg-surface-raised ring-1 ring-black/[0.07] dark:ring-white/10 transition-all shrink-0
                     flex items-center gap-1.5"
        >
          <ArrowCounterClockwise
            weight="duotone"
            className={cn('w-4 h-4', (liveRefreshing || isLoading) && 'animate-spin [animation-direction:reverse]')}
          />
          <span className="hidden sm:inline">{isLoading ? 'Loading...' : 'Refresh'}</span>
        </button>

        {/* Counter */}
        <span className="text-xs text-text-muted ml-auto tabular-nums">
          {isLoading ? '...' : mode === 'history' ? `${historyTotal} total` : `${filtered.length} entries`}
        </span>
      </div>

      {/* Error banner */}
      {(liveError || historyError) && (
        <div className="mx-4 mt-4 bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 text-sm text-accent-red">
          {liveError || historyError} — ensure the agent is running on port 5000
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider w-[100px]">Time</th>
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider w-[75px]">Method</th>
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider">Path</th>
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider w-[65px]">Status</th>
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider hidden md:table-cell">IP</th>
              <th className="text-right py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider w-[85px] hidden sm:table-cell">Latency</th>
            </tr>
          </thead>
          <tbody>
            {/* Live mode: empty / no matches / data */}
            {mode === 'live' && isEmpty && !liveError && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-text-muted">
                  <p className="text-sm">No requests yet</p>
                  <p className="text-xs mt-1 text-text-muted/60">
                    Requests to your Traefik proxy will appear here live
                  </p>
                </td>
              </tr>
            )}
            {mode === 'live' && noMatches && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-text-muted text-sm">
                  No matching entries — try adjusting your search
                </td>
              </tr>
            )}
            {mode === 'live' &&
              filtered.map((l, i) => (
                <LogRow key={`${l.time}-${i}`} log={l} />
              ))}

            {/* History mode: loading / empty / data */}
            {mode === 'history' && historyLoading && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-text-muted text-sm">Loading...</td>
              </tr>
            )}
            {mode === 'history' && !historyLoading && historyLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-text-muted text-sm">
                  No matching records in history
                </td>
              </tr>
            )}
            {mode === 'history' &&
              historyLogs.map((l, i) => (
                <LogRow key={`hist-${l.time}-${i}`} log={l} />
              ))}
          </tbody>
        </table>
      </div>

      {/* History pagination */}
      {mode === 'history' && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 text-xs text-text-muted">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 rounded-md hover:bg-surface-raised disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1 rounded-md hover:bg-surface-raised disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Log row component ─────────────────────────────────────────

function LogRow({ log: l }: { log: LogEntry }) {
  return (
    <tr className="border-b border-border/30 hover:bg-surface-raised/50 transition-colors">
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
  )
}
