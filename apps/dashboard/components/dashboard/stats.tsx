'use client'

import { useState } from 'react'
import { cn } from '@kyle/ui'
import {
  TrafficSign,
  Clock,
  WarningCircle,
  Cloud,
} from '@phosphor-icons/react'
import { StatDrawer } from './stat-drawer'

interface Analytics {
  totalRequests: number
  statusBreakdown: Record<string, number>
  avgLatencyMs: string
  errorRate: number
  requestsPerMinute: number
  requestsByHour: { hour: string; count: number }[]
  latencyByHour: { hour: string; avgLatency: number }[]
  latencyDist?: { bucket: string; count: number }[]
}

type DrawerContent = {
  type: string
  title: string
  value: string
  color: string
  runningNames: string[]
  stoppedNames: string[]
  analytics: Analytics | null
}

export function DashboardStats({
  running, total, analytics, services: runningNames, stoppedNames,
}: {
  running: number
  total: number
  analytics: Analytics | null
  services: string[]
  stoppedNames: string[]
}) {
  const [drawer, setDrawer] = useState<DrawerContent | null>(null)

  const open = (type: string, title: string, value: string, color: string) => {
    setDrawer({ type, title, value, color, runningNames, stoppedNames, analytics })
  }

  const stats = [
    {
      key: 'traffic',
      label: 'Total Requests',
      Icon: TrafficSign,
      value: analytics ? analytics.totalRequests.toLocaleString() : '',
      color: 'text-text-secondary',
    },
    {
      key: 'clock',
      label: 'Avg Latency',
      Icon: Clock,
      value: analytics ? `${analytics.avgLatencyMs} ms` : '',
      color: 'text-accent-teal',
    },
    {
      key: 'warning',
      label: 'Error Rate',
      Icon: WarningCircle,
      value: analytics ? `${analytics.errorRate}%` : '',
      color: 'text-accent-orange',
    },
    {
      key: 'globe',
      label: 'Active Services',
      Icon: Cloud,
      value: `${running}/${total}`,
      color: 'text-accent-purple',
    },
  ]

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => {
          const hasData = s.value !== ''

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => hasData && open(s.key, s.label, s.value, s.color)}
              className={cn(
                'flex items-start gap-4 text-left transition-opacity',
                hasData && 'cursor-pointer hover:opacity-70',
                !hasData && 'cursor-default',
              )}
            >
              <div className={cn('mt-0.5', s.color)}>
                <s.Icon weight="duotone" className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                {hasData ? (
                  <div className="text-2xl font-light text-text-primary">{s.value}</div>
                ) : (
                  <div className="h-7 w-20 bg-surface-raised rounded animate-pulse mb-1" />
                )}
                <div className="text-xs text-text-secondary mt-1">{s.label}</div>
              </div>
            </button>
          )
        })}
      </div>

      {drawer && (
        <StatDrawer
          type={drawer.type}
          title={drawer.title}
          value={drawer.value}
          color={drawer.color}
          running={drawer.runningNames}
          stopped={drawer.stoppedNames}
          analytics={drawer.analytics}
          onClose={() => setDrawer(null)}
        />
      )}
    </>
  )
}
