import { PRIVACY_FIELD_HINTS, type PrivacyHintKind } from '../../config/privacy'
import { cn } from '../../lib/ui'

interface PrivacyFieldHintProps {
  kind: PrivacyHintKind
  className?: string
}

export function PrivacyFieldHint({ kind, className }: PrivacyFieldHintProps) {
  return (
    <span className={cn('mt-1.5 block text-xs leading-5 text-slate-500', className)}>
      {PRIVACY_FIELD_HINTS[kind]}
    </span>
  )
}

