import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { BellRinging } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = { title: 'Alerts' }

export default function AlertsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={<BellRinging weight="duotone" className="w-7 h-7 text-primary" />}
        title="Alerts"
        description="Error, latency, and anomaly notifications"
      />

      <div className="bg-surface rounded-xl ring-1 ring-black/[0.07] dark:ring-white/10 p-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            disabled
            className="h-[38px] px-4 rounded-lg bg-primary text-white text-sm font-medium
                       opacity-40 cursor-not-allowed"
            aria-disabled
          >
            Add alert
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-text-muted font-medium text-xs uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left py-2 px-3 text-text-muted font-medium text-xs uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left py-2 px-3 text-text-muted font-medium text-xs uppercase tracking-wider">
                  Condition
                </th>
                <th className="text-left py-2 px-3 text-text-muted font-medium text-xs uppercase tracking-wider">
                  Channel
                </th>
                <th className="text-left py-2 px-3 text-text-muted font-medium text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right py-2 px-3 text-text-muted font-medium text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="space-y-2">
                    <p className="text-sm text-text-muted">Alert rules coming soon</p>
                    <p className="text-xs text-text-muted/50">
                      Configure error, latency, and anomaly alerts for your services
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
