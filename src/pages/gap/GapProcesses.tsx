import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Edit3,
  ExternalLink,
  GitBranch,
  Info,
  Layers3,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  createGapProcess,
  deleteGapProcess,
  getGapProcesses,
  updateGapProcess,
  type GapProcessInput,
} from '../../services/gapService'
import type { GapProcess } from '../../types/gap'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'

interface ProcessFormState {
  code: string
  name: string
  description: string
  order_index: string
}

const emptyForm: ProcessFormState = {
  code: '',
  name: '',
  description: '',
  order_index: '0',
}

const toNullable = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const buildPayload = (form: ProcessFormState): GapProcessInput => ({
  code: form.code.trim(),
  name: form.name.trim(),
  description: toNullable(form.description),
  order_index: Number(form.order_index) || 0,
})

export default function GapProcesses() {
  const { user } = useAuth()
  const [processes, setProcesses] = useState<GapProcess[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProcess, setEditingProcess] = useState<GapProcess | null>(null)
  const [form, setForm] = useState<ProcessFormState>(emptyForm)

  useEffect(() => {
    if (!user?.id) return

    const fetchProcesses = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getGapProcesses(user.id)
        setProcesses(data)
      } catch (fetchError) {
        console.error('Errore caricamento processi Gap:', fetchError)
        setError('Impossibile caricare la libreria processi.')
      } finally {
        setLoading(false)
      }
    }

    fetchProcesses()
  }, [user?.id])

  const filteredProcesses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return processes.filter((process) => {
      return (
        !normalizedSearch ||
        process.code.toLowerCase().includes(normalizedSearch) ||
        process.name.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [processes, searchTerm])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingProcess(null)
    setShowForm(false)
    setError(null)
  }

  const startCreate = () => {
    setForm(emptyForm)
    setEditingProcess(null)
    setShowForm(true)
    setError(null)
  }

  const startEdit = (process: GapProcess) => {
    setForm({
      code: process.code,
      name: process.name,
      description: process.description || '',
      order_index: String(process.order_index ?? 0),
    })
    setEditingProcess(process)
    setShowForm(true)
    setError(null)
  }

  const saveProcess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.id) return

    if (!form.code.trim() || !form.name.trim()) {
      setError('Codice e nome sono obbligatori.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = buildPayload(form)

      if (editingProcess) {
        const updatedProcess = await updateGapProcess(editingProcess.id, user.id, payload)
        setProcesses((current) =>
          current.map((process) => process.id === updatedProcess.id ? updatedProcess : process),
        )
      } else {
        const createdProcess = await createGapProcess(user.id, payload)
        setProcesses((current) => [...current, createdProcess].sort((a, b) => {
          if (a.order_index !== b.order_index) return a.order_index - b.order_index
          return a.name.localeCompare(b.name, 'it')
        }))
      }

      resetForm()
    } catch (saveError) {
      console.error('Errore salvataggio processo Gap:', saveError)
      setError('Impossibile salvare il processo. Verifica codice e dati inseriti.')
    } finally {
      setSaving(false)
    }
  }

  const removeProcess = async (process: GapProcess) => {
    if (!user?.id) return
    if (!confirm(`Eliminare il processo "${process.code} - ${process.name}"? Verranno eliminati anche i Domini/Sezioni collegati se non vincolati da assessment.`)) return

    setError(null)

    try {
      await deleteGapProcess(process.id, user.id)
      setProcesses((current) => current.filter((item) => item.id !== process.id))
    } catch (deleteError) {
      console.error('Errore eliminazione processo Gap:', deleteError)
      setError('Impossibile eliminare il processo. Potrebbe essere gia collegato ad assessment o dati operativi.')
    }
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title="Processi Gap"
        description="Definisci macro-processi riutilizzabili secondo la gerarchia Processo -> Dominio/Sezione -> Contesto operativo -> Attivita/Requisito."
        eyebrow="Gap Analysis"
        icon={<Layers3 className="h-6 w-6" />}
        actions={(
          <Button type="button" tone="success" icon={<Plus className="h-4 w-4" />} onClick={startCreate}>
            Nuovo macro-processo
          </Button>
        )}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardHeader
            actions={(
              <Button
                type="button"
                variant="ghost"
                tone="neutral"
                icon={<X className="h-4 w-4" />}
                onClick={resetForm}
              >
                Annulla
              </Button>
            )}
          >
            <CardTitle>{editingProcess ? 'Modifica macro-processo' : 'Nuovo macro-processo'}</CardTitle>
            <CardDescription>
              Il processo rappresenta un macro-flusso valutabile. Al suo interno potrai organizzare
              Domini/Sezioni, cioe fasi o sottosezioni, e Attivita/Requisiti, cioe azioni o controlli valutabili.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProcess} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                    Codice *
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                      title="Codice sintetico e stabile del macro-processo, utile per identificarlo rapidamente in libreria, assessment e report. Preferisci sigle brevi, coerenti e riconoscibili nel tempo."
                      aria-label="Aiuto codice macro-processo"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </span>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                    className="clinical-input"
                    required
                  />
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Usa un codice breve e stabile per identificare il macro-processo in valutazioni e report.
                  </span>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Nome *</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="clinical-input"
                    placeholder="Es. Gestione farmaci antiblastici, Gestione magazzino farmaceutico"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Ordine di visualizzazione</span>
                  <input
                    type="number"
                    min="0"
                    value={form.order_index}
                    onChange={(event) => setForm((current) => ({ ...current, order_index: event.target.value }))}
                    className="clinical-input"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Descrizione</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="clinical-input min-h-24 resize-y"
                    placeholder="Descrivi ambito del processo, confini operativi, contesto operativo prevalente e criteri di inclusione."
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button type="button" variant="outline" tone="neutral" onClick={resetForm}>
                  Annulla
                </Button>
                <Button type="submit" tone="success" loading={saving}>
                  {editingProcess ? 'Salva modifiche' : 'Crea macro-processo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="clinical-input py-2 pl-10 pr-4"
              placeholder="Cerca processo per codice o nome..."
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            Caricamento processi...
          </CardContent>
        </Card>
      ) : processes.length === 0 ? (
        <EmptyState
          icon={<Layers3 className="h-6 w-6" />}
          title="Nessun macro-processo disponibile"
          description="Crea il primo macro-processo della libreria Gap. Ogni macro-processo conterra Domini/Sezioni, Contesti operativi descrittivi e Attivita/Requisiti valutabili."
          action={(
            <Button type="button" tone="success" icon={<Plus className="h-4 w-4" />} onClick={startCreate}>
              Crea macro-processo
            </Button>
          )}
        />
      ) : filteredProcesses.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Nessun macro-processo trovato"
          description="Modifica il testo di ricerca per visualizzare altri macro-processi."
        />
      ) : (
        <div className="grid gap-4">
          {filteredProcesses.map((process) => (
            <Card key={process.id} className="transition hover:shadow-clinical">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="success">{process.code}</Badge>
                      <Badge variant="neutral">Locale</Badge>
                      <Badge variant="info">Ordine {process.order_index}</Badge>
                    </div>
                    <h2 className="mt-3 text-base font-semibold text-slate-900">{process.name}</h2>
                    {process.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-500">{process.description}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                    <Link
                      to={`/gap/process/${process.id}`}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-teal-50 px-3 text-sm font-medium text-teal-800 transition hover:bg-teal-100"
                    >
                      <GitBranch className="h-4 w-4" />
                      Apri
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      tone="neutral"
                      size="sm"
                      icon={<Edit3 className="h-4 w-4" />}
                      onClick={() => startEdit(process)}
                    >
                      Modifica
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      tone="risk"
                      size="sm"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => removeProcess(process)}
                    >
                      Elimina
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
