import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { DashboardSkeleton } from '@/components/dashboard/skeleton'

export const metadata: Metadata = { title: 'Dashboard' }
export const revalidate = 15

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
