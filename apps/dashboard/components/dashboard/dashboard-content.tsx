import { PageHeader } from '@/components/layout/page-header'
import { DashboardStats } from '@/components/dashboard/stats'
import { DashboardMap } from '@/components/dashboard/map'
import { getServices } from '@/lib/traefik'
import { Lightning } from '@phosphor-icons/react/dist/ssr'

async function getAnalytics() {
  try {
    const res = await fetch('http://localhost:3000/api/stats', { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function DashboardContent() {
  let services: Awaited<ReturnType<typeof getServices>> = []
  try { services = await getServices() } catch { /* */ }
  const running = services.filter(s => s.status === 'running').length
  const total = services.length
  const runningNames = services.filter(s => s.status === 'running').map(s => s.name)
  const analytics = await getAnalytics()

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 md:p-6 lg:p-8 space-y-8 pb-0">
        <PageHeader icon={<Lightning weight="duotone" className="w-7 h-7 text-primary" />} title="Dashboard" description="Requests, latency, and error monitoring" />
        <DashboardStats running={running} total={total} analytics={analytics} services={runningNames} />
      </div>
      <div className="flex-1 mt-8 w-full">
        <DashboardMap />
      </div>
    </div>
  )
}
