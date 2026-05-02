import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'

export interface GapInlineDomainFormPayload {
  code: string
  name: string
  description: string
}

interface GapInlineDomainFormProps {
  loading?: boolean
  onCancel: () => void
  onSubmit: (payload: GapInlineDomainFormPayload) => void
}

const emptyForm: GapInlineDomainFormPayload = {
  code: '',
  name: '',
  description: '',
}

export function GapInlineDomainForm({
  loading = false,
  onCancel,
  onSubmit,
}: GapInlineDomainFormProps) {
  const [form, setForm] = useState<GapInlineDomainFormPayload>(emptyForm)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Codice Dominio/Sezione *
          </span>
          <input
            type="text"
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            className="clinical-input bg-white"
            placeholder="Codice sintetico del Dominio/Sezione"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Nome Dominio/Sezione *
          </span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="clinical-input bg-white"
            placeholder="Es. Allestimento"
            required
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Descrizione</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="clinical-input min-h-20 resize-y bg-white"
            placeholder="Ambito, contesto operativo o confini del Dominio/Sezione."
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
        <Button type="submit" tone="success" loading={loading}>
          Salva Dominio/Sezione
        </Button>
      </div>
    </form>
  )
}
