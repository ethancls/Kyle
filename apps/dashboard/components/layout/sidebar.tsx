'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@kyle/ui'
import { ThemeToggle } from './theme-toggle'
import { KyleLogo } from './kyle-logo'
import {
  Lightning,
  TrendUp,
  Detective,
  CodesandboxLogo,
  ArrowsLeftRight,
  CompassRose,
  BellRinging,
  Gear,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Lightning },
  { name: 'Analytics', href: '/analytics', icon: TrendUp },
  { name: 'Logs', href: '/logs', icon: Detective },
  { name: 'Services', href: '/services', icon: CodesandboxLogo },
  { name: 'Firewall', href: '/firewall', icon: ArrowsLeftRight },
  { name: 'Agents', href: '/agents', icon: CompassRose },
  { name: 'Alerts', href: '/alerts', icon: BellRinging },
  { name: 'Settings', href: '/settings', icon: Gear },
]

export function Sidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'bg-surface flex flex-col shrink-0 transition-all duration-200',
        collapsed ? 'w-16' : 'w-56',
        className,
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 px-4 pt-8 pb-6 relative overflow-hidden',
          collapsed && 'px-0 pt-6 pb-4',
        )}
      >
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-border) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          }}
        />
        <KyleLogo
          className={cn(
            'relative z-10 text-primary shrink-0 transition-all',
            collapsed ? 'w-7 h-7' : 'w-9 h-9',
          )}
        />
        {!collapsed && (
          <span
            className="relative z-10 font-bold text-lg text-text-primary uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            Kyle
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              title={collapsed ? item.name : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-colors duration-150 cursor-pointer',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised',
              )}
            >
              <item.icon
                weight={isActive ? 'duotone' : 'regular'}
                className="w-6 h-6"
              />
              {!collapsed && item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer: Theme + Collapse toggle */}
      <div
        className={cn(
          'flex items-center px-3 py-3',
          collapsed ? 'flex-col gap-2' : 'justify-between',
        )}
      >
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer
                     text-text-muted hover:text-text-primary hover:bg-surface-raised
                     transition-colors"
        >
          {collapsed ? (
            <CaretRight weight="bold" className="w-4 h-4" />
          ) : (
            <CaretLeft weight="bold" className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
