import { Globe, Plug, ArrowUpRight } from '@phosphor-icons/react/dist/ssr'
import type { ServiceInfo } from '@lens/shared'
import { ServiceActions } from './actions'

function portFromUrl(url: string): string | null {
  if (url === '-') return null
  try {
    return new URL(url).port || null
  } catch {
    const match = url.match(/:(\d+)/)
    return match ? match[1] : null
  }
}

type Props = { services: ServiceInfo[] }

export function ServicesGrid({ services }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {services.map((svc) => {
        const port = portFromUrl(svc.url)
        const running = svc.status === 'running'

        return (
          <div
            key={svc.id}
            className="bg-surface rounded-xl p-4 flex items-stretch gap-4
                       ring-1 ring-black/[0.07] dark:ring-white/10
                       transition-colors duration-150
                       md:hover:bg-surface-raised"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    running
                      ? 'bg-[#00F58D] animate-[breathe_2.5s_ease-in-out_infinite]'
                      : 'bg-text-muted'
                  }`}
                  style={
                    running
                      ? {
                          animationDelay: `${(parseInt(svc.id, 36) % 2500)}ms`,
                          boxShadow: '0 0 6px rgba(0, 245, 141, 0.4)',
                        }
                      : undefined
                  }
                />
                <span className="text-sm font-medium text-text-primary truncate">
                  {svc.name}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Globe
                    weight="duotone"
                    className={`w-4 h-4 shrink-0 ${svc.hostname ? 'text-primary' : 'text-text-muted'}`}
                  />
                  {svc.hostname ? (
                    <a
                      href={`https://${svc.hostname}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline truncate"
                    >
                      <span className="truncate text-xs">{svc.hostname}</span>
                      <ArrowUpRight
                        weight="bold"
                        className="w-3 h-3 shrink-0 text-text-secondary"
                      />
                    </a>
                  ) : (
                    <span className="text-xs font-mono text-text-muted">----</span>
                  )}
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    port ? 'text-accent-purple' : 'text-text-muted'
                  }`}
                >
                  <Plug weight="duotone" className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-mono">{port || '0000'}</span>
                </div>
              </div>
            </div>

            {svc.id.endsWith('@docker') ? (
              <ServiceActions name={svc.name} running={running} />
            ) : (
              <div className="flex items-center pl-3 border-l border-border/50 w-[108px] shrink-0">
                <span className="text-[10px] text-text-muted uppercase">External</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
