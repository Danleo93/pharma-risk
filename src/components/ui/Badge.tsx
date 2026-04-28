import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/ui'

type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'fmea' | 'rca' | 'risk'
type BadgeSize = 'sm' | 'md'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  info: 'border-sky-200 bg-sky-100 text-sky-700',
  success: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  warning: 'border-amber-200 bg-amber-100 text-amber-800',
  danger: 'border-red-200 bg-red-100 text-red-700',
  fmea: 'border-sky-200 bg-sky-100 text-sky-700',
  rca: 'border-orange-200 bg-orange-100 text-orange-800',
  risk: 'border-rose-200 bg-rose-100 text-rose-700',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export function Badge({ variant = 'neutral', size = 'sm', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}
