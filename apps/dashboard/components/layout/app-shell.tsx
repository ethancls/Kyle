'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { List, X } from '@phosphor-icons/react'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar — always visible */}
      <Sidebar className="hidden md:flex" />

      <main className="flex-1 overflow-y-auto relative">
        {/* Mobile hamburger — top right */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="md:hidden fixed top-3 right-3 z-50 w-9 h-9 rounded-lg
                     flex items-center justify-center
                     text-text-secondary hover:text-primary transition-colors"
        >
          {open ? <X weight="bold" className="w-5 h-5" /> : <List weight="bold" className="w-5 h-5" />}
        </button>
        {children}
      </main>

      {/* Mobile sidebar — full height, right side, closes on nav */}
      {open && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56 bg-surface shadow-2xl">
            <Sidebar className="flex" onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

