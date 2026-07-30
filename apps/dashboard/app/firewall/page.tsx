'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { ArrowsLeftRight, Trash } from '@phosphor-icons/react'
const FirewallIcon = ArrowsLeftRight

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed')
    return r.json()
  })

interface FirewallEntry {
  target: string
  type: string
  reason?: string
  added: string
  expires: string
}

export default function FirewallPage() {
  const { data, mutate, isLoading } = useSWR('/api/firewall', fetcher, {
    refreshInterval: 10_000,
  })

  const [form, setForm] = useState({
    value: '',
    type: 'ip',
    reason: '',
    duration: 'permanent',
  })
  const [submitting, setSubmitting] = useState(false)

  const entries: FirewallEntry[] = data?.entries ?? []

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!form.value.trim()) return

      setSubmitting(true)
      try {
        const res = await fetch('/api/firewall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'block',
            type: form.type,
            value: form.value.trim(),
            reason: form.reason.trim() || undefined,
            duration: form.duration,
          }),
        })

        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed')
        toast.success(`Blocked ${form.value.trim()}`)
        setForm({ value: '', type: 'ip', reason: '', duration: 'permanent' })
        mutate()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Block failed')
      } finally {
        setSubmitting(false)
      }
    },
    [form, mutate],
  )

  const handleUnblock = useCallback(
    async (value: string) => {
      try {
        const res = await fetch('/api/firewall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'unblock', value }),
        })

        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed')
        toast.success(`Unblocked ${value}`)
        mutate()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Unblock failed')
      }
    },
    [mutate],
  )

  const formatDate = (iso: string) => {
    if (!iso) return '--'
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const durationOptions = [
    { value: '1h', label: '1 hour' },
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
    { value: 'permanent', label: 'Permanent' },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={<ArrowsLeftRight weight="duotone" className="w-7 h-7 text-primary" />}
        title="Firewall"
        description="Block and unblock IPs, ranges, and countries"
      />

      <div className="bg-surface rounded-xl ring-1 ring-black/[0.07] dark:ring-white/10 p-4 space-y-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted font-medium">Target</label>
            <input
              type="text"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              placeholder="1.2.3.4 or 10.0.0.0/24"
              className="h-[38px] w-52 px-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10
                         text-sm text-text-primary placeholder:text-text-muted
                         focus:outline-none focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted font-medium">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="h-[38px] px-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10
                         text-sm text-text-primary focus:outline-none focus:ring-primary/50"
            >
              <option value="ip">IP</option>
              <option value="range">Range</option>
              <option value="country">Country</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted font-medium">Reason</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Optional"
              className="h-[38px] w-40 px-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10
                         text-sm text-text-primary placeholder:text-text-muted
                         focus:outline-none focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted font-medium">Duration</label>
            <select
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              className="h-[38px] px-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10
                         text-sm text-text-primary focus:outline-none focus:ring-primary/50"
            >
              {durationOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting || !form.value.trim()}
            className="h-[38px] px-5 rounded-lg bg-primary text-white text-sm font-medium
                       hover:bg-primary-glow transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Blocking...' : 'Block'}
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-text-muted font-medium text-xs uppercase tracking-wider">Target</th>
                <th className="text-left py-2 px-3 text-text-muted font-medium text-xs uppercase tracking-wider">Type</th>
                <th className="text-left py-2 px-3 text-text-muted font-medium text-xs uppercase tracking-wider">Reason</th>
                <th className="text-left py-2 px-3 text-text-muted font-medium text-xs uppercase tracking-wider">Added</th>
                <th className="text-left py-2 px-3 text-text-muted font-medium text-xs uppercase tracking-wider">Expires</th>
                <th className="text-right py-2 px-3 text-text-muted font-medium text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted text-sm">
                    Loading...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted text-sm">
                    No firewall rules yet. Block IPs to see them here.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.target} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="py-2.5 px-3 text-text-primary font-mono text-xs">{entry.target}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-background ring-1 ring-black/[0.07] dark:ring-white/10 text-text-secondary">
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary text-xs max-w-[160px] truncate" title={entry.reason}>
                      {entry.reason || '--'}
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary text-xs">{formatDate(entry.added)}</td>
                    <td className="py-2.5 px-3 text-text-secondary text-xs">{entry.expires || 'permanent'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleUnblock(entry.target)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-accent-red
                                   hover:bg-accent-red/10 transition-colors cursor-pointer"
                      >
                        <Trash weight="bold" className="w-3.5 h-3.5" />
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
