'use client'

import { WarningCircle } from '@phosphor-icons/react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <WarningCircle
          weight="duotone"
          className="w-12 h-12 text-accent-orange mx-auto mb-4"
        />
        <h2 className="text-lg font-medium text-text-primary mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm
                     hover:bg-primary-glow transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
