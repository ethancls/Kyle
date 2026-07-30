'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@lens/ui'
import {
  Lightning,
  Scroll,
  CodesandboxLogo,
  ArrowsLeftRight,
  List,
} from '@phosphor-icons/react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

type NavItem = {
  name: string
  href: string
  icon: PhosphorIcon
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Lightning },
  { name: 'Logs', href: '/logs', icon: Scroll },
  { name: 'Services', href: '/services', icon: CodesandboxLogo },
  { name: 'Firewall', href: '/firewall', icon: ArrowsLeftRight },
]

type Props = {
  className?: string
  onMenu: () => void
}

export function MobileNav({ className, onMenu }: Props) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'bg-surface border-t border-border flex items-center justify-around',
        'py-2 safe-bottom',
        className,
      )}
    >
      {navigation.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg',
              'text-[10px] font-light transition-colors',
              isActive
                ? 'text-primary'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            <item.icon
              weight={isActive ? 'duotone' : 'regular'}
              className="w-5 h-5"
            />
            {item.name}
          </Link>
        )
      })}

      {/* Hamburger — opens full sidebar */}
      <button
        type="button"
        onClick={onMenu}
        className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg
                   text-[10px] font-light text-text-muted hover:text-text-secondary transition-colors"
      >
        <List weight="regular" className="w-5 h-5" />
        Menu
      </button>
    </nav>
  )
}
