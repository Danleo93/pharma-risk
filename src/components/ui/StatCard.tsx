import type { ReactNode } from 'react'
import { cn } from '../../lib/ui'

type StatTone = 'clinical' | 'fmea' | 'rca' | 'success' | 'warning' | 'risk' | 'neutral'

interface StatCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  description?: ReactNode
  tone?: StatTone
  className?: string
}

const toneClasses: Record<StatTone, { icon: string; accent: string }> = {
  clinical: { icon: 'bg-sky-50 text-sky-700', accent: 'bg-sky-500' },
  fmea: { icon: 'bg-sky-50 text-sky-700', accent: 'bg-sky-500' },
  rca: { icon: 'bg-orange-50 text-orange-700', accent: 'bg-orange-500' },
  success: { icon: 'bg-emerald-50 text-emerald-700', accent: 'bg-emerald-500' },
  warning: { icon: 'bg-amber-50 text-amber-700', accent: 'bg-amber-500' },
  risk: { icon: 'bg-red-50 text-red-700', accent: 'bg-red-500' },
  neutral: { icon: 'bg-slate-100 text-slate-700', accent: 'bg-slate-400' },
}

export function StatCard({
  label,
  value,
  icon,
  description,
  tone = 'clinical',
  className,
}: StatCardProps) {
  const classes = toneClasses[tone]

  return (
    <section className={cn('relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className={cn('absolute inset-x-0 top-0 h-1', classes.accent)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          {description && <div className="mt-2 text-sm text-slate-500">{description}</div>}
        </div>
        {icon && (
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', classes.icon)}>
            {icon}
          </div>
        )}
      </div>
    </section>
  )
}
