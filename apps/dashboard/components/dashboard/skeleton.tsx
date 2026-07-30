export function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-full animate-pulse">
      <div className="p-4 md:p-6 lg:p-8 space-y-8 pb-0">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-surface-raised" />
          <div className="space-y-1.5">
            <div className="h-5 w-32 bg-surface-raised rounded" />
            <div className="h-3.5 w-48 bg-surface-raised rounded" />
          </div>
        </div>

        {/* KPI placeholders — no cards, just pulsing bars */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-6 h-6 bg-surface-raised rounded-lg mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="h-7 w-20 bg-surface-raised rounded" />
                <div className="h-3 w-14 bg-surface-raised rounded" />
                <div className="h-3 w-16 bg-surface-raised rounded mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map skeleton */}
      <div className="flex-1 mt-8 w-full h-[500px] md:h-[650px] bg-surface rounded-t-xl" />
    </div>
  )
}
