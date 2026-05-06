import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/ui'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'
type ButtonTone = 'clinical' | 'fmea' | 'rca' | 'success' | 'risk' | 'neutral'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  tone?: ButtonTone
  icon?: ReactNode
  iconRight?: ReactNode
  loading?: boolean
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55'

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
  icon: 'h-10 w-10 p-0',
}

const toneClasses: Record<ButtonTone, Record<ButtonVariant, string>> = {
  clinical: {
    primary: 'bg-sky-700 text-white hover:bg-sky-800 focus-visible:ring-sky-500',
    secondary: 'bg-sky-50 text-sky-800 hover:bg-sky-100 focus-visible:ring-sky-500',
    outline: 'border border-sky-200 bg-white text-sky-800 hover:bg-sky-50 focus-visible:ring-sky-500',
    ghost: 'text-sky-800 hover:bg-sky-50 focus-visible:ring-sky-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  },
  fmea: {
    primary: 'bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500',
    secondary: 'bg-sky-50 text-sky-700 hover:bg-sky-100 focus-visible:ring-sky-500',
    outline: 'border border-sky-200 bg-white text-sky-700 hover:bg-sky-50 focus-visible:ring-sky-500',
    ghost: 'text-sky-700 hover:bg-sky-50 focus-visible:ring-sky-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  },
  rca: {
    primary: 'bg-orange-600 text-white hover:bg-orange-700 focus-visible:ring-orange-500',
    secondary: 'bg-orange-50 text-orange-800 hover:bg-orange-100 focus-visible:ring-orange-500',
    outline: 'border border-orange-200 bg-white text-orange-800 hover:bg-orange-50 focus-visible:ring-orange-500',
    ghost: 'text-orange-800 hover:bg-orange-50 focus-visible:ring-orange-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  },
  success: {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
    secondary: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus-visible:ring-emerald-500',
    outline: 'border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50 focus-visible:ring-emerald-500',
    ghost: 'text-emerald-800 hover:bg-emerald-50 focus-visible:ring-emerald-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  },
  risk: {
    primary: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    secondary: 'bg-red-50 text-red-800 hover:bg-red-100 focus-visible:ring-red-500',
    outline: 'border border-red-200 bg-white text-red-800 hover:bg-red-50 focus-visible:ring-red-500',
    ghost: 'text-red-800 hover:bg-red-50 focus-visible:ring-red-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  },
  neutral: {
    primary: 'bg-slate-800 text-white hover:bg-slate-900 focus-visible:ring-slate-500',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-500',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-500',
    ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  },
}

export function Button({
  variant = 'primary',
  size = 'md',
  tone = 'clinical',
  icon,
  iconRight,
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(baseClasses, sizeClasses[size], toneClasses[tone][variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  )
}
