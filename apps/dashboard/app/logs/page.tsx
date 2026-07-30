import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { LogsClient } from '@/components/logs/client'
import { Detective } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = { title: 'Logs' }

export default function LogsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={<Detective weight="duotone" className="w-7 h-7 text-primary" />}
        title="Logs"
        description="Real-time request log inspection"
      />
      <LogsClient />
    </div>
  )
}
