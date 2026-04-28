import type { ReactNode } from 'react'
import { cn } from '../../lib/ui'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm',
        className,
      )}
    >
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
