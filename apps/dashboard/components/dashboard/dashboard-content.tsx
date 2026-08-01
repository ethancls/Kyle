import { PageHeader } from '@/components/layout/page-header'
import { DashboardStats } from '@/components/dashboard/stats'
import { DashboardMap } from '@/components/dashboard/map'
import { getServices, ensureRecentSync } from '@/lib/agent'
import { getStats } from '@/lib/logdb'
import { Lightning } from '@phosphor-icons/react/dist/ssr'

export async function DashboardContent() {
  let services: Awaited<ReturnType<typeof getServices>> = []
  try { services = await getServices() } catch (err) { console.error('[Dashboard] getServices failed:', err) }

  const running = services.filter((s) => s.status === 'running').length
  const total = services.length
  const runningNames = services.filter((s) => s.status === 'running').map((s) => s.name)
  const stoppedNames = services.filter((s) => s.status !== 'running').map((s) => s.name)

  // Sync logs from agent → SQLite, then read stats from DB directly
  let analytics = null
  try {
    await ensureRecentSync(2000)
    analytics = getStats()
  } catch (err) { console.error('[Dashboard] ensureRecentSync/getStats failed:', err) }

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 md:p-6 lg:p-8 space-y-8 pb-0">
        <PageHeader
          icon={<Lightning weight="duotone" className="w-7 h-7 text-primary" />}
          title="Dashboard"
          description="Requests, latency, and error monitoring"
        />
        <DashboardStats
          running={running}
          total={total}
          analytics={analytics}
          services={runningNames}
          stoppedNames={stoppedNames}
        />
      </div>
      <div className="flex-1 mt-8 w-full">
        <DashboardMap />
      </div>
    </div>
  )
}
