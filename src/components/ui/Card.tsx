import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/ui'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  actions?: ReactNode
}

export function Card({ elevated = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white',
        elevated ? 'shadow-clinical' : 'shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ actions, className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between', className)} {...props}>
      <div className="min-w-0">{children}</div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold text-slate-900', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm leading-6 text-slate-500', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}
