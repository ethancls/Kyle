'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowCounterClockwise, Stop, Play, CircleNotch } from '@phosphor-icons/react'

type Props = {
  name: string
  running: boolean
}

async function doAction(action: string, service: string) {
  const res = await fetch('/api/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, service }),
  })
  if (!res.ok) throw new Error()
}

export function ServiceActions({ name, running }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const labels: Record<string, string> = {
    restart: 'Restarted',
    start: 'Started',
    stop: 'Stopped',
  }

  const handle = async (act: string) => {
    setLoading(act)
    try {
      await doAction(act, name)
      toast.success(`${labels[act]} ${name}`)
      await new Promise((r) => setTimeout(r, 2000))
      router.refresh()
    } catch {
      toast.error(`Failed to ${act} ${name}`)
    }
    setTimeout(() => setLoading(null), 1500)
  }

  return (
    <div className="flex items-center gap-1 pl-3 border-l border-border/50 w-[108px] shrink-0">
      {running ? (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handle('restart')}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-accent-orange md:hover:bg-surface-raised
                     transition-colors disabled:opacity-40"
        >
          {loading === 'restart' ? (
            <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowCounterClockwise weight="duotone" className="w-4 h-4" />
          )}
        </button>
      ) : (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handle('start')}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-accent-teal md:hover:bg-surface-raised
                     transition-colors disabled:opacity-40"
        >
          {loading === 'start' ? (
            <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
          ) : (
            <Play weight="duotone" className="w-4 h-4" />
          )}
        </button>
      )}
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => handle('stop')}
        className="w-8 h-8 rounded-lg flex items-center justify-center
                   text-accent-red md:hover:bg-surface-raised
                   transition-colors disabled:opacity-40"
      >
        {loading === 'stop' ? (
          <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
        ) : (
          <Stop weight="duotone" className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
