import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import {
  GAP_VERIFICATION_RESULT_OPTIONS,
  getGapVerificationResultLabel,
} from '../../lib/labels'
import type { GapAction, GapVerificationResult } from '../../types/gap'
import type { GapActionVerificationInput } from '../../services/gapService'
import { Button } from '../ui/Button'

interface GapActionVerificationModalProps {
  action: GapAction
  defaultVerifiedBy?: string
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: GapActionVerificationInput) => void
}

type VerificationOutcome = Exclude<GapVerificationResult, 'pending'>

interface VerificationFormState {
  verification_method: string
  verification_result: VerificationOutcome
  verification_notes: string
  verified_by: string
}

const verificationOptions = GAP_VERIFICATION_RESULT_OPTIONS.filter((option) =>
  option.value !== 'pending',
) as { value: VerificationOutcome; label: string }[]

export function GapActionVerificationModal({
  action,
  defaultVerifiedBy = '',
  loading = false,
  onClose,
  onSubmit,
}: GapActionVerificationModalProps) {
  const [form, setForm] = useState<VerificationFormState>({
    verification_method: action.verification_method || '',
    verification_result: action.verification_result !== 'pending'
      ? action.verification_result as VerificationOutcome
      : 'effective',
    verification_notes: action.verification_notes || '',
    verified_by: action.verified_by || defaultVerifiedBy,
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      verification_method: form.verification_method.trim() || null,
      verification_result: form.verification_result,
      verification_notes: form.verification_notes.trim() || null,
      verified_by: form.verified_by.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Verifica efficacia
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              {action.description}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Chiudi verifica efficacia"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Metodo di verifica
            </span>
            <input
              type="text"
              value={form.verification_method}
              onChange={(event) => setForm((current) => ({
                ...current,
                verification_method: event.target.value,
              }))}
              className="clinical-input"
              placeholder="Es. audit documentale, osservazione diretta, controllo indicatori"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Esito verifica *
              </span>
              <select
                value={form.verification_result}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  verification_result: event.target.value as VerificationOutcome,
                }))}
                className="clinical-input"
                required
              >
                {verificationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Verificato da
              </span>
              <input
                type="text"
                value={form.verified_by}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  verified_by: event.target.value,
                }))}
                className="clinical-input"
                placeholder="Nome, funzione o email"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Note verifica
            </span>
            <textarea
              value={form.verification_notes}
              onChange={(event) => setForm((current) => ({
                ...current,
                verification_notes: event.target.value,
              }))}
              className="clinical-input min-h-24 resize-y"
              placeholder="Documenta evidenze, limiti o motivazione dell'esito."
            />
          </label>

          {form.verification_result === 'ineffective' && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
              Esito {getGapVerificationResultLabel(form.verification_result)}: valuta una nuova azione o modifica quella esistente.
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" tone="neutral" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" tone="success" loading={loading}>
              Salva verifica
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
