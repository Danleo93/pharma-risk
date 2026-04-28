import type { ReactNode } from 'react'
import { cn } from '../../lib/ui'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  eyebrow?: string
  icon?: ReactNode
  actions?: ReactNode
  backAction?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  actions,
  backAction,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-8', className)}>
      {backAction && <div className="mb-4">{backAction}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {eyebrow}
                </p>
              )}
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {title}
              </h1>
            </div>
          </div>
          {description && <div className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
