'use client'

import useSWR from 'swr'
import { PageHeader } from '@/components/layout/page-header'
import { CompassRose } from '@phosphor-icons/react'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('unreachable')
    return r.json()
  })

export default function AgentsPage() {
  const { data, error, isLoading } = useSWR('/api/agents/status', fetcher, {
    refreshInterval: 15_000,
    shouldRetryOnError: true,
    errorRetryCount: 2,
  })

  const healthy = !error && data?.status === 'ok'

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={<CompassRose weight="duotone" className="w-7 h-7 text-primary" />}
        title="Agents"
        description="Connected agent instances and health"
      />

      <div className="bg-surface rounded-xl ring-1 ring-black/[0.07] dark:ring-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider">Agent</th>
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider">URL</th>
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider">Auth</th>
              <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            <tr>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: healthy ? 'var(--color-accent-teal)' : 'var(--color-accent-red)',
                      boxShadow: healthy
                        ? '0 0 6px rgba(0, 168, 143, 0.4)'
                        : '0 0 6px rgba(217, 64, 64, 0.4)',
                    }}
                  />
                  <span className="text-text-primary font-medium">Traefik Agent</span>
                </div>
              </td>
              <td className="py-3 px-4 text-text-secondary font-mono text-xs">
                <span className="select-all">localhost:5000</span>
              </td>
              <td className="py-3 px-4 text-text-secondary text-xs">Bearer Token</td>
              <td className="py-3 px-4">
                {isLoading ? (
                  <span className="text-text-muted text-xs">Checking...</span>
                ) : healthy ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent-teal/10 text-accent-teal font-medium">
                    Connected
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red font-medium">
                    Unreachable
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {error && (
          <div className="px-4 py-3 bg-accent-red/5 text-xs text-accent-red border-t border-accent-red/10">
            Cannot reach agent. Make sure the agent is running.
          </div>
        )}
      </div>
    </div>
  )
}
