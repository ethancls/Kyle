import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Gear } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = { title: 'Settings' }

const AGENT_API_URL =
  process.env.AGENT_API_URL ?? 'http://localhost:5000'
const VERSION = '0.1.0'

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={<Gear weight="duotone" className="w-7 h-7 text-primary" />}
        title="Settings"
        description="Preferences, tokens, and API configuration"
      />

      <div className="space-y-6 max-w-lg">
        {/* Appearance */}
        <section className="bg-surface rounded-xl ring-1 ring-black/[0.07] dark:ring-white/10 p-4">
          <h3 className="text-sm font-medium text-text-primary mb-4">
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Theme</p>
              <p className="text-xs text-text-muted">
                Toggle between light and dark mode
              </p>
            </div>
            <ThemeToggle />
          </div>
        </section>

        {/* Connection */}
        <section className="bg-surface rounded-xl ring-1 ring-black/[0.07] dark:ring-white/10 p-4">
          <h3 className="text-sm font-medium text-text-primary mb-4">
            Agent Connection
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">
                Agent API URL
              </label>
              <input
                type="text"
                readOnly
                value={AGENT_API_URL}
                className="w-full h-[38px] px-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10
                           text-sm text-text-primary font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">
                Agent Token
              </label>
              <input
                type="password"
                readOnly
                value="••••••••"
                className="w-full h-[38px] px-3 rounded-lg bg-background ring-1 ring-black/[0.07] dark:ring-white/10
                           text-sm text-text-primary font-mono focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Version */}
        <section className="bg-surface rounded-xl ring-1 ring-black/[0.07] dark:ring-white/10 p-4">
          <h3 className="text-sm font-medium text-text-primary mb-4">About</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">App version</span>
            <span className="font-mono text-text-primary">{VERSION}</span>
          </div>
        </section>
      </div>
    </div>
  )
}
