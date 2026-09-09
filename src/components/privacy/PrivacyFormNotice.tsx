import { ShieldAlert } from 'lucide-react'
import { PRIVACY_COPY } from '../../config/privacy'
import { cn } from '../../lib/ui'

interface PrivacyFormNoticeProps {
  className?: string
  compact?: boolean
}

export function PrivacyFormNotice({ className, compact = false }: PrivacyFormNoticeProps) {
  return (
    <div className={cn(
      'flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 text-sky-950',
      compact ? 'px-3 py-2.5' : 'p-4',
      className,
    )}>
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
      <div>
        <p className="text-sm font-semibold">{PRIVACY_COPY.formTitle}</p>
        <p className="mt-1 text-xs leading-5 text-sky-800">{PRIVACY_COPY.formNotice}</p>
      </div>
    </div>
  )
}

