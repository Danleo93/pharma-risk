import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'

export interface GapInlineActivityFormPayload {
  name: string
  description: string
  operator: string
  target_state: string
}

interface GapInlineActivityFormProps {
  generatedCode: string | null
  limitReached?: boolean
  loading?: boolean
  onCancel: () => void
  onSubmit: (payload: GapInlineActivityFormPayload) => void
}

const emptyForm: GapInlineActivityFormPayload = {
  name: '',
  description: '',
  operator: '',
  target_state: '',
}

export function GapInlineActivityForm({
  generatedCode,
  limitReached = false,
  loading = false,
  onCancel,
  onSubmit,
}: GapInlineActivityFormProps) {
  const [form, setForm] = useState<GapInlineActivityFormPayload>(emptyForm)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (limitReached) return

    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      operator: form.operator.trim(),
      target_state: form.target_state.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Codice generato
        </p>
        <p className="mt-1 font-mono text-sm font-semibold text-slate-800">
          {generatedCode || 'Limite raggiunto'}
        </p>
      </div>

      {limitReached && (
        <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          Non si possono inserire piu di 99 Attivita/Requisiti per Dominio/Sezione. Procedi con la creazione di un nuovo Dominio/Sezione.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Nome Attivita/Requisito *
          </span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="clinical-input"
            placeholder="Es. Preparazione in cappa biologica"
            required
            disabled={limitReached}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Responsabile/i</span>
          <input
            type="text"
            value={form.operator}
            onChange={(event) => setForm((current) => ({ ...current, operator: event.target.value }))}
            className="clinical-input"
            placeholder="Figura o team responsabile"
            disabled={limitReached}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Target atteso di riferimento</span>
          <input
            type="text"
            value={form.target_state}
            onChange={(event) => setForm((current) => ({ ...current, target_state: event.target.value }))}
            className="clinical-input"
            placeholder="Requisito o stato atteso"
            disabled={limitReached}
          />
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            Definisce lo stato atteso standard dell'Attivita/Requisito nella libreria.
          </span>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Descrizione</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="clinical-input min-h-20 resize-y"
            placeholder="Descrizione del controllo, requisito o attivita valutabile."
            disabled={limitReached}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Annulla
        </button>
        <Button type="submit" tone="success" loading={loading} disabled={limitReached || !generatedCode}>
          Salva Attivita/Requisito
        </Button>
      </div>
    </form>
  )
}
