import { Download, ShieldCheck } from 'lucide-react'
import { PRIVACY_COPY } from '../../config/privacy'
import { cn } from '../../lib/ui'

interface ExportPrivacyWarningProps {
  className?: string
}

export function ExportPrivacyWarning({ className }: ExportPrivacyWarningProps) {
  return (
    <div className={cn('rounded-lg border border-slate-200 bg-slate-50 p-3', className)}>
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-200">
          <Download className="h-4 w-4" />
          <ShieldCheck className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-white text-emerald-600" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">{PRIVACY_COPY.exportTitle}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{PRIVACY_COPY.exportNotice}</p>
        </div>
      </div>
    </div>
  )
}

