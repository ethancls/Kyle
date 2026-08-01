'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { cn } from '@kyle/ui'

export function RefreshButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRefresh = () => {
    if (loading) return
    setLoading(true)
    router.refresh()
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 h-[38px] px-3 rounded-lg text-sm shrink-0',
        'text-text-secondary hover:text-text-primary',
        'hover:bg-surface ring-1 ring-black/[0.07] dark:ring-white/10 transition-all',
        loading && 'opacity-60',
      )}
    >
      <ArrowCounterClockwise
        weight="duotone"
        className={cn(
          'w-4 h-4 transition-transform',
          loading && 'animate-spin [animation-direction:reverse]',
        )}
      />
      <span className="hidden sm:inline">{loading ? 'Refreshing…' : 'Refresh'}</span>
    </button>
  )
}
