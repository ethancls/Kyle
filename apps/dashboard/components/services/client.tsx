'use client'

import { useState, useMemo } from 'react'
import type { ServiceInfo } from '@kyle/shared'
import { ServicesGrid } from './grid'
import { RefreshButton } from './refresh-button'
import { SearchBar } from './search-bar'
import { CodesandboxLogo, MagnifyingGlass } from '@phosphor-icons/react'
import { PageHeader } from '@/components/layout/page-header'

type Props = {
  initialServices: ServiceInfo[]
  initialError: string | null
}

export function ServicesClient({ initialServices, initialError }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return initialServices
    const q = query.toLowerCase()
    return initialServices.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.hostname?.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q),
    )
  }, [initialServices, query])

  const running = initialServices.filter((s) => s.status === 'running').length
  const total = initialServices.length

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={<CodesandboxLogo weight="duotone" className="w-7 h-7 text-primary" />}
        title="Services"
        description="Health and status of proxied services"
      />

      <div className="flex items-center gap-3">
        <SearchBar value={query} onChange={setQuery} />
        <RefreshButton />
        {!initialError && total > 0 && (
          <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-text-primary">{running}</span>
              <span className="text-[10px] text-text-muted uppercase">running</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-text-primary">{total}</span>
              <span className="text-[10px] text-text-muted uppercase">total</span>
            </div>
          </div>
        )}
      </div>

      {initialError ? (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 text-sm text-accent-red">
          {initialError}
        </div>
      ) : total === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <MagnifyingGlass weight="duotone" className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted text-sm">No services found</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted text-sm">
            No results for &ldquo;{query}&rdquo;
          </p>
        </div>
      ) : (
        <ServicesGrid services={filtered} />
      )}
    </div>
  )
}
