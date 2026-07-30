'use client'

import { cn } from '@lens/ui'
import { X } from '@phosphor-icons/react'
import {
  TrafficSign, Clock, WarningCircle, Cloud,
} from '@phosphor-icons/react'
import { AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Analytics = {
  totalRequests: number
  statusBreakdown: Record<string, number>
  avgLatencyMs: string
  errorRate: number
  latencyDist?: { bucket: string; count: number }[]
}

type Props = {
  type: string; title: string; value: string; color: string
  running: string[]; stopped: string[]
  analytics: Analytics | null
  onClose: () => void
}

const iconMap: Record<string, typeof TrafficSign> = {
  traffic: TrafficSign, clock: Clock, warning: WarningCircle, globe: Cloud,
}

function ServicesContent({ running, stopped }: { running: string[]; stopped: string[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Running</h3>
        <div className="space-y-1.5">
          {running.length === 0 ? <p className="text-sm text-text-muted">No services running</p>
            : running.slice(0, 20).map((name) => (
                <div key={name} className="flex items-center gap-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-teal shrink-0" />
                  <span className="text-sm text-text-primary truncate">{name}</span>
                </div>
              ))
          }
        </div>
      </div>
      {stopped.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Stopped</h3>
          <div className="space-y-1.5">
            {stopped.map((name) => (
              <div key={name} className="flex items-center gap-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted shrink-0" />
                <span className="text-sm text-text-primary truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TrafficContent({ a }: { a: NonNullable<Props['analytics']> }) {
  return (
    <div className="space-y-5 overflow-hidden">
      <div>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Status Breakdown</h3>
        {Object.entries(a.statusBreakdown).every(([,c]) => c === 0) ? (
          <p className="text-sm text-text-muted py-2">No requests recorded yet.</p>
        ) : (
        <div className="space-y-2">
          {Object.entries(a.statusBreakdown).map(([range, count]) => {
            const pct = a.totalRequests > 0 ? (count / a.totalRequests) * 100 : 0
            const c = range === '2xx' ? 'bg-accent-teal' : range === '3xx' ? 'bg-accent-orange' : range === '4xx' ? 'bg-accent-orange/70' : 'bg-accent-red'
            return (
              <div key={range} className="flex items-center gap-3">
                <span className="text-xs font-mono text-text-muted w-8">{range}</span>
                <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                  <div className={`h-full ${c} rounded-full`} style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
                <span className="text-xs font-mono text-text-secondary w-8 text-right">{count}</span>
              </div>
            )
          })}
        </div>
        )}
      </div>
      {a.totalRequests < 3 ? (
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Request Volume</h3>
          <p className="text-sm text-text-muted py-2">Not enough data for time series yet.</p>
        </div>
      ) : (
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Request Volume</h3>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={Array.from({ length: 24 }, (_, i) => ({ t: `${i}h`, v: i === new Date().getHours() ? a.totalRequests : 0 }))} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
              <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0066FF" stopOpacity={0.25} /><stop offset="100%" stopColor="#0066FF" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} interval={3} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-primary)' }} formatter={(v: number) => [`${v}`, 'Requests']} />
              <Area type="monotone" dataKey="v" stroke="#0066FF" strokeWidth={1.5} fill="url(#tg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function LatencyContent({ a }: { a: NonNullable<Props['analytics']> }) {
  const dist = a.latencyDist?.map(d => ({ b: d.bucket, c: d.count })) ?? []
  return (
    <div className="space-y-5 overflow-hidden">
      <div>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Latency Over Time</h3>
        {a.totalRequests < 5 ? (
          <p className="text-sm text-text-muted py-4">Not enough data yet. Waiting for more traffic...</p>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={Array.from({ length: 24 }, (_, i) => ({ t: `${i}h`, v: i === new Date().getHours() ? Number(a.avgLatencyMs) : 0 }))} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
              <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00B4A0" stopOpacity={0.25} /><stop offset="100%" stopColor="#00B4A0" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} interval={4} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-primary)' }} formatter={(v: number) => [`${v} ms`, 'Latency']} />
              <Area type="monotone" dataKey="v" stroke="#00B4A0" strokeWidth={1.5} fill="url(#lg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      {dist.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Latency Distribution</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={dist} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="b" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} interval={0} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-primary)' }} formatter={(v: number) => [`${v} req`, 'Count']} />
              <Bar dataKey="c" fill="#0066FF" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function ErrorContent({ a }: { a: NonNullable<Props['analytics']> }) {
  return (
    <div className="space-y-5">
      <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Error Breakdown</h3>
      {[{ code: '500', label: 'Internal Server Error', count: a.statusBreakdown['5xx'] },
        { code: '502', label: 'Bad Gateway', count: 0 },
        { code: '503', label: 'Service Unavailable', count: 0 },
        { code: '504', label: 'Gateway Timeout', count: 0 }].map((e) => (
        <div key={e.code} className="flex items-center gap-4 py-1">
          <span className="text-sm font-mono text-accent-red font-medium w-10">{e.code}</span>
          <span className="text-sm text-text-primary flex-1">{e.label}</span>
          <span className="text-sm font-mono text-text-secondary">{e.count}</span>
        </div>
      ))}
    </div>
  )
}

export function StatDrawer({ type, title, value, color, running, stopped, analytics, onClose }: Props) {
  const Icon = iconMap[type]
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[420px] max-w-[92vw] bg-surface z-[9999] shadow-2xl overflow-y-auto overflow-x-hidden">
        <div className="sticky top-0 bg-surface px-6 py-4 flex items-start justify-between z-10 border-b border-border/50">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && <div className={cn('mt-0.5', color)}><Icon weight="duotone" className="w-6 h-6" /></div>}
            <div className="min-w-0">
              <div className="text-2xl font-light text-text-primary">{value}</div>
              <h2 className="text-sm text-text-secondary mt-0.5">{title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors ml-4">
            <X weight="bold" className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          {type === 'traffic' && analytics && <TrafficContent a={analytics} />}
          {type === 'clock' && analytics && <LatencyContent a={analytics} />}
          {type === 'warning' && analytics && <ErrorContent a={analytics} />}
          {type === 'globe' && <ServicesContent running={running} stopped={stopped} />}
        </div>
      </div>
    </>
  )
}
