import Link from 'next/link'
import type { Metadata } from 'next'
import { GlobeHemisphereEast, House } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = { title: 'Page Not Found' }

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <div className="text-center max-w-sm">
        <GlobeHemisphereEast weight="duotone" className="w-16 h-16 text-text-muted mx-auto mb-6" />
        <h1 className="text-lg font-medium text-text-primary mb-2">Page not found</h1>
        <p className="text-sm text-text-muted mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 h-[38px] px-4 rounded-lg bg-primary text-white text-sm font-medium
                     hover:bg-primary-glow transition-colors"
        >
          <House weight="duotone" className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
