export function PageSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-surface-raised" />
        <div className="space-y-1.5">
          <div className="h-5 w-32 bg-surface-raised rounded" />
          <div className="h-3.5 w-48 bg-surface-raised rounded" />
        </div>
      </div>

      {/* Content placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-surface-raised" />
              <div className="h-4 w-24 bg-surface-raised rounded" />
            </div>
            <div className="ml-[18px] space-y-2">
              <div className="h-4 w-32 bg-surface-raised rounded" />
              <div className="h-4 w-16 bg-surface-raised rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
