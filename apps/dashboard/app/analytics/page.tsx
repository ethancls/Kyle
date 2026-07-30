import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { AnalyticsClient } from '@/components/analytics/client'
import { TrendUp } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={<TrendUp weight="duotone" className="w-7 h-7 text-primary" />}
        title="Analytics"
        description="Traffic breakdown by status and origin"
      />
      <AnalyticsClient />
    </div>
  )
}
