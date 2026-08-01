import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { cva, type VariantProps } from 'class-variance-authority'
export { cva }
export type { VariantProps }

// ── Reusable UI primitives ────────────────────────────────────

import React from 'react'

// ── Input ──────────────────────────────────────────────────────

const inputClasses =
  'h-[38px] w-full px-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-primary/50 font-[inherit]'

export function Input({ className, ...props }: React.ComponentPropsWithoutRef<'input'>) {
  return <input className={cn(inputClasses, className)} {...props} />
}

// ── Select ─────────────────────────────────────────────────────

const selectClasses =
  'h-[38px] px-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10 text-sm text-text-primary focus:outline-none focus:ring-primary/50 font-[inherit]'

export function Select({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'select'>) {
  return (
    <select className={cn(selectClasses, className)} {...props}>
      {children}
    </select>
  )
}

// ── Badge / Pill ───────────────────────────────────────────────

const badgeVariants = cva(
  'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-background ring-1 ring-black/[0.07] dark:ring-white/10 text-text-secondary',
        teal: 'bg-accent-teal/10 text-accent-teal',
        red: 'bg-accent-red/10 text-accent-red',
        orange: 'bg-accent-orange/10 text-accent-orange',
        purple: 'bg-accent-purple/10 text-accent-purple',
        primary: 'bg-primary/10 text-primary',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentPropsWithoutRef<'span'> & { variant?: 'default' | 'teal' | 'red' | 'orange' | 'purple' | 'primary' }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

// ── Status Dot ─────────────────────────────────────────────────

export function StatusDot({ active, className }: { active: boolean; className?: string }) {
  return (
    <span
      className={cn('w-2 h-2 rounded-full shrink-0', className)}
      style={{
        backgroundColor: active ? 'var(--color-accent-teal)' : 'var(--color-text-muted)',
        boxShadow: active ? '0 0 6px rgba(0, 168, 143, 0.4)' : 'none',
      }}
    />
  )
}

// ── Empty State ────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn('bg-surface rounded-xl ring-1 ring-black/[0.07] dark:ring-white/10 p-12 text-center', className)}>
      {icon && <div className="text-text-muted mx-auto mb-4">{icon}</div>}
      <p className="text-sm text-text-muted">{title}</p>
      {description && <p className="text-xs mt-1 text-text-muted/60">{description}</p>}
    </div>
  )
}

// ── Error Banner ───────────────────────────────────────────────

export function ErrorBanner({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 text-sm text-accent-red', className)}>
      {children}
    </div>
  )
}

// ── Panel / Card ───────────────────────────────────────────────

export function Panel({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-surface rounded-xl ring-1 ring-black/[0.07] dark:ring-white/10 p-5', className)}>
      {title && (
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-4">{title}</h2>
      )}
      {children}
    </div>
  )
}

// ── Table Skeleton ─────────────────────────────────────────────

export function TableSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-16">
        <div className="space-y-3 animate-pulse max-w-xs mx-auto">
          <div className="h-3 bg-surface-raised rounded w-3/4 mx-auto" />
          <div className="h-3 bg-surface-raised rounded w-1/2 mx-auto" />
          <div className="h-3 bg-surface-raised rounded w-5/6 mx-auto" />
        </div>
      </td>
    </tr>
  )
}
