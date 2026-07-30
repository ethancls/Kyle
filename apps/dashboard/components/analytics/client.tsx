'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { cn } from '@lens/ui'

interface AnalyticsData {
  totalRequests: number
  statusBreakdown: Record<string, number>
  topPaths: { path: string; count: number }[]
  topHosts: { host: string; count: number }[]
  avgLatencyMs: number
  requestsPerMinute: number
}

const STATUS_COLORS: Record<string, string> = {
  '2xx': '#00B4A0',
  '3xx': '#F59E0B',
  '4xx': '#EF4444',
  '5xx': '#8B5CF6',
}

function statusLabel(key: string): string {
  const labels: Record<string, string> = {
    '2xx': '2xx Success',
    '3xx': '3xx Redirect',
    '4xx': '4xx Client Error',
    '5xx': '5xx Server Error',
  }
  return labels[key] ?? key
}

function formatLatency(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  if (ms >= 1) return `${ms.toFixed(1)}ms`
  if (ms > 0) return `${(ms * 1000).toFixed(0)}μs`
  return '0ms'
}

function Panel({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-surface rounded-xl ring-1 ring-black/[0.07] dark:ring-white/10 p-5',
        className,
      )}
    >
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-4">
        {title}
      </h2>
      {children}
    </div>
  )
}

function PulsePlaceholder() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-full space-y-3 animate-pulse">
        <div className="h-3 bg-surface-raised rounded w-3/4" />
        <div className="h-3 bg-surface-raised rounded w-1/2" />
        <div className="h-3 bg-surface-raised rounded w-5/6" />
        <div className="h-3 bg-surface-raised rounded w-2/3" />
      </div>
    </div>
  )
}

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch('/api/analytics?limit=1000')
      if (!res.ok) throw new Error()
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json as AnalyticsData)
      setError(null)
    } catch {
      setError('Failed to load analytics')
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const isEmpty = !loading && (!data || data.totalRequests === 0)

  // Status chart data
  const statusData = data
    ? Object.entries(data.statusBreakdown)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => ({ name: statusLabel(key), key, count }))
    : []

  // Top paths data (reversed for horizontal bar: largest at top)
  const pathsData = data
    ? [...data.topPaths].reverse().map((p) => ({
        name: p.path.length > 40 ? p.path.slice(0, 40) + '...' : p.path,
        fullPath: p.path,
        count: p.count,
      }))
    : []

  return (
    <div className="space-y-6">
      {/* Refresh + total */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => fetchData(true)}
          className="h-[38px] px-4 rounded-lg text-sm text-text-secondary hover:text-text-primary
                     hover:bg-surface-raised ring-1 ring-black/[0.07] dark:ring-white/10 transition-all
                     flex items-center gap-2 bg-surface"
        >
          <ArrowCounterClockwise
            weight="duotone"
            className={cn('w-4 h-4', refreshing && 'animate-spin')}
          />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
        {data && (
          <span className="text-sm text-text-muted tabular-nums">
            {data.totalRequests.toLocaleString()} total requests
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 text-sm text-accent-red">
          {error} — ensure the agent is running on port 5000
        </div>
      )}

      {/* Empty state */}
      {isEmpty && !error && (
        <div className="bg-surface rounded-xl ring-1 ring-black/[0.07] dark:ring-white/10 p-12 text-center">
          <p className="text-sm text-text-muted">No traffic data yet</p>
          <p className="text-xs mt-1 text-text-muted/60">
            Analytics will appear once your proxy handles requests
          </p>
        </div>
      )}

      {/* Charts grid */}
      {data && !isEmpty && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests by Status */}
          <Panel title="Requests by Status">
            {loading ? (
              <PulsePlaceholder />
            ) : statusData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-text-muted">
                No status data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface-raised)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '13px',
                      color: 'var(--color-text-primary)',
                    }}
                    cursor={{ fill: 'var(--color-surface-raised)', opacity: 0.4 }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={STATUS_COLORS[entry.key] ?? 'var(--color-primary)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>

          {/* Top Paths */}
          <Panel title="Top Paths">
            {loading ? (
              <PulsePlaceholder />
            ) : pathsData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-text-muted">
                No path data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={pathsData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                    axisLine={false}
                    tickLine={false}
                    width={140}
                  />
                  <Tooltip
                    formatter={(count: number, _name: string, props: { payload?: { fullPath?: string } }) => [
                      `${count} requests`,
                      props.payload?.fullPath ?? '',
                    ]}
                    contentStyle={{
                      backgroundColor: 'var(--color-surface-raised)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '13px',
                      color: 'var(--color-text-primary)',
                    }}
                    cursor={{ fill: 'var(--color-surface-raised)', opacity: 0.4 }}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 6, 6, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>

          {/* Requests per Minute */}
          <Panel title="Requests per Minute">
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="text-4xl font-light text-text-primary tabular-nums tracking-tight">
                  {data.requestsPerMinute.toLocaleString()}
                </div>
                <div className="text-sm text-text-muted mt-2">requests / min</div>
                <div className="text-xs text-text-muted/60 mt-1">
                  over {data.totalRequests.toLocaleString()} total requests
                </div>
              </div>
            </div>
          </Panel>

          {/* Average Latency */}
          <Panel title="Average Latency">
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="text-4xl font-light text-text-primary tabular-nums tracking-tight">
                  {formatLatency(data.avgLatencyMs)}
                </div>
                <div className="text-sm text-text-muted mt-2">average response time</div>
                <div className="text-xs text-text-muted/60 mt-1">
                  across {data.totalRequests.toLocaleString()} requests
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}
