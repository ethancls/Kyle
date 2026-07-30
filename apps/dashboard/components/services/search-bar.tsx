'use client'

import { MagnifyingGlass } from '@phosphor-icons/react'

type Props = {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <MagnifyingGlass
        weight="duotone"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
      />
      <input
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full sm:w-56 h-[38px] pl-9 pr-3 rounded-lg bg-surface ring-1 ring-black/[0.07] dark:ring-white/10
                   text-sm text-text-primary placeholder:text-text-muted
                   focus:outline-none focus:ring-primary/50 transition-colors"
      />
    </div>
  )
}
