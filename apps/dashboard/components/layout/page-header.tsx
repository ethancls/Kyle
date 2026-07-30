import type { ReactNode } from 'react'

type Props = {
  icon: ReactNode
  title: string
  description: string
}

export function PageHeader({ icon, title, description }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h1 className="text-xl font-light text-text-primary leading-tight">{title}</h1>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
    </div>
  )
}
