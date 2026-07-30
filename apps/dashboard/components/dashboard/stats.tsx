'use client'

import { useState } from 'react'
import { cn } from '@lens/ui'
import {
  TrafficSign,
  Clock,
  WarningCircle,
  Cloud,
} from '@phosphor-icons/react'
import { StatDrawer } from './stat-drawer'

const iconMap = { traffic: TrafficSign, clock: Clock, warning: WarningCircle, globe: Cloud }

type Analytics = { totalRequests: number; statusBreakdown: Record<string, number>; avgLatencyMs: string; errorRate: number } | null

type DrawerContent = {
  type: string
  title: string
  value: string
  color: string
  runningNames: string[]
  stoppedNames: string[]
  analytics: Analytics
}

export function DashboardStats({
  running, total, analytics, services: runningNames,
}: {
  running: number; total: number; analytics: Analytics; services: string[]
}) {
  const stoppedNames = ['n8n'] // TODO: get from real data
  const [drawer, setDrawer] = useState<DrawerContent | null>(null)

  const open = (type: string, title: string, value: string, color: string) => {
    setDrawer({ type, title, value, color, runningNames, stoppedNames, analytics })
  }

  const stats = [
    {
      key: 'traffic', label: 'Requests/min', Icon: TrafficSign,
      value: analytics ? String(analytics.totalRequests) : '',
      sub: '',
      color: 'text-text-secondary',
    },
    {
      key: 'clock', label: 'Avg Latency', Icon: Clock,
      value: analytics ? `${analytics.avgLatencyMs} ms` : '',
      sub: '',
      color: 'text-accent-teal',
    },
    {
      key: 'warning', label: 'Error Rate', Icon: WarningCircle,
      value: analytics ? `${analytics.errorRate}%` : '',
      sub: '',
      color: 'text-accent-orange',
    },
    {
      key: 'globe', label: 'Active Services', Icon: Cloud,
      value: `${running}/${total}`,
      sub: '',
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

      {drawer && <StatDrawer type={drawer.type} title={drawer.title} value={drawer.value} color={drawer.color} running={drawer.runningNames} stopped={drawer.stoppedNames} analytics={drawer.analytics} onClose={() => setDrawer(null)} />}
    </>
  )
}
