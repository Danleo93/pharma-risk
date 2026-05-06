import { useState, type FormEvent } from 'react'
import { Info } from 'lucide-react'
import { Button } from '../ui/Button'

export interface GapInlineDomainFormPayload {
  code: string
  name: string
  operational_context: string
  description: string
  order_index: string
  add_to_library: boolean
}

interface GapInlineDomainFormProps {
  loading?: boolean
  showLibraryToggle?: boolean
  defaultAddToLibrary?: boolean
  onCancel: () => void
  onSubmit: (payload: GapInlineDomainFormPayload) => void
}

const emptyForm: GapInlineDomainFormPayload = {
  code: '',
  name: '',
  operational_context: '',
  description: '',
  order_index: '0',
  add_to_library: true,
}

export function GapInlineDomainForm({
  loading = false,
  showLibraryToggle = false,
  defaultAddToLibrary = true,
  onCancel,
  onSubmit,
}: GapInlineDomainFormProps) {
  const [form, setForm] = useState<GapInlineDomainFormPayload>({
    ...emptyForm,
    add_to_library: defaultAddToLibrary,
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      code: form.code.trim(),
      name: form.name.trim(),
      operational_context: form.operational_context.trim(),
      description: form.description.trim(),
      order_index: form.order_index,
      add_to_library: form.add_to_library,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
            Codice Dominio/Sezione *
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              title="Codice sintetico e stabile del Dominio/Sezione, utile per identificarlo rapidamente in libreria, assessment e report. Preferisci sigle brevi e riconoscibili."
              aria-label="Aiuto codice Dominio/Sezione"
            >
              <Info className="h-4 w-4" />
            </button>
          </span>
          <input
            type="text"
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            className="clinical-input bg-white"
            placeholder="Codice sintetico del Dominio/Sezione"
            required
          />
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            Usa un codice sintetico e riconoscibile per identificare il Dominio/Sezione in valutazioni e report.
          </span>
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

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Ordine di visualizzazione
          </span>
          <input
            type="number"
            min="0"
            value={form.order_index}
            onChange={(event) => setForm((current) => ({ ...current, order_index: event.target.value }))}
            className="clinical-input bg-white"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Contesto operativo</span>
          <input
            type="text"
            value={form.operational_context}
            onChange={(event) => setForm((current) => ({ ...current, operational_context: event.target.value }))}
            className="clinical-input bg-white"
            placeholder="Es. UFA, Magazzino farmaceutico, Reparto, Laboratorio galenico"
          />
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            Per ora il contesto operativo viene salvato nella descrizione del Dominio/Sezione; in futuro potra diventare un campo strutturato.
          </span>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Descrizione</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="clinical-input min-h-20 resize-y bg-white"
            placeholder="Ambito del Dominio/Sezione, confini e note operative."
          />
        </label>
      </div>

      {showLibraryToggle && (
        <label className="mt-4 flex items-start gap-3 rounded-lg border border-teal-100 bg-white p-3">
          <input
            type="checkbox"
            checked={form.add_to_library}
            onChange={(event) => setForm((current) => ({
              ...current,
              add_to_library: event.target.checked,
            }))}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800">
              Aggiungi alla libreria personale
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Se non aggiungi l'elemento alla libreria personale, sara disponibile solo in questo assessment.
            </span>
          </span>
        </label>
      )}

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
