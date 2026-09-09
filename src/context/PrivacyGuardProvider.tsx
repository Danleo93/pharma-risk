import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react'
import { PRIVACY_COPY, PRIVACY_PATTERN_LABELS } from '../config/privacy'
import {
  registerPrivacyReviewHandler,
  type PrivacyReviewRequest,
} from '../lib/privacyRuntime'
import { Button } from '../components/ui/Button'

interface PendingReview {
  request: PrivacyReviewRequest
  resolve: (approved: boolean) => void
}

export function PrivacyGuardProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingReview | null>(null)

  useEffect(() => registerPrivacyReviewHandler((request) => new Promise<boolean>((resolve) => {
    setPending({ request, resolve })
  })), [])

  const close = (approved: boolean) => {
    pending?.resolve(approved)
    setPending(null)
  }

  return (
    <>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="privacy-review-title">
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-amber-200 bg-white shadow-2xl">
            <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50 px-5 py-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h2 id="privacy-review-title" className="text-base font-semibold text-slate-950">{PRIVACY_COPY.scanTitle}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{PRIVACY_COPY.scanDescription}</p>
              </div>
            </div>

            <div className="space-y-3 px-5 py-4">
              {pending.request.findings.map((finding) => (
                <div key={`${finding.field}:${finding.kind}`} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{finding.fieldLabel}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Possibile {PRIVACY_PATTERN_LABELS[finding.kind]}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {finding.count} {finding.count === 1 ? 'occorrenza' : 'occorrenze'}
                  </span>
                </div>
              ))}
              <p className="text-xs leading-5 text-slate-500">
                Il contenuto rilevato non viene mostrato né registrato. Se si tratta di un falso positivo puoi proseguire con conferma esplicita.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" tone="neutral" icon={<ShieldCheck className="h-4 w-4" />} onClick={() => close(true)}>
                Conferma falso positivo e procedi
              </Button>
              <Button type="button" tone="rca" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => close(false)}>
                Torna a modificare
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
