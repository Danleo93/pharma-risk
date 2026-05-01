import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  BookMarked,
  Edit3,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  createGapStandard,
  deleteGapStandard,
  getGapStandards,
  updateGapStandard,
  type GapStandardInput,
} from '../../services/gapService'
import type { GapStandard } from '../../types/gap'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'

interface StandardFormState {
  code: string
  name: string
  version: string
  issuing_body: string
  description: string
  url: string
}

const emptyForm: StandardFormState = {
  code: '',
  name: '',
  version: '',
  issuing_body: '',
  description: '',
  url: '',
}

const toNullable = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const buildPayload = (form: StandardFormState): GapStandardInput => ({
  code: form.code.trim(),
  name: form.name.trim(),
  version: toNullable(form.version),
  issuing_body: toNullable(form.issuing_body),
  description: toNullable(form.description),
  url: toNullable(form.url),
})

const formatDate = (date: string | null) => {
  return date ? new Date(date).toLocaleDateString('it-IT') : 'N/D'
}

export default function GapStandards() {
  const { user } = useAuth()
  const [standards, setStandards] = useState<GapStandard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [issuingBodyFilter, setIssuingBodyFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingStandard, setEditingStandard] = useState<GapStandard | null>(null)
  const [form, setForm] = useState<StandardFormState>(emptyForm)

  useEffect(() => {
    if (!user?.id) return

    const fetchStandards = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getGapStandards(user.id)
        setStandards(data)
      } catch (fetchError) {
        console.error('Errore caricamento norme Gap:', fetchError)
        setError('Impossibile caricare il catalogo norme.')
      } finally {
        setLoading(false)
      }
    }

    fetchStandards()
  }, [user?.id])

  const issuingBodies = useMemo(() => {
    const values = standards
      .map((standard) => standard.issuing_body)
      .filter((value): value is string => Boolean(value))

    return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'it'))
  }, [standards])

  const filteredStandards = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return standards.filter((standard) => {
      const matchesSearch =
        !normalizedSearch ||
        standard.code.toLowerCase().includes(normalizedSearch) ||
        standard.name.toLowerCase().includes(normalizedSearch)
      const matchesIssuingBody =
        issuingBodyFilter === 'all' || standard.issuing_body === issuingBodyFilter

      return matchesSearch && matchesIssuingBody
    })
  }, [issuingBodyFilter, searchTerm, standards])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingStandard(null)
    setShowForm(false)
    setError(null)
  }

  const startCreate = () => {
    setForm(emptyForm)
    setEditingStandard(null)
    setShowForm(true)
    setError(null)
  }

  const startEdit = (standard: GapStandard) => {
    setForm({
      code: standard.code,
      name: standard.name,
      version: standard.version || '',
      issuing_body: standard.issuing_body || '',
      description: standard.description || '',
      url: standard.url || '',
    })
    setEditingStandard(standard)
    setShowForm(true)
    setError(null)
  }

  const saveStandard = async (event: FormEvent<HTMLFormElement>) => {
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

      if (editingStandard) {
        const updatedStandard = await updateGapStandard(editingStandard.id, user.id, payload)
        setStandards((current) =>
          current.map((standard) => standard.id === updatedStandard.id ? updatedStandard : standard),
        )
      } else {
        const createdStandard = await createGapStandard(user.id, payload)
        setStandards((current) => [createdStandard, ...current])
      }

      resetForm()
    } catch (saveError) {
      console.error('Errore salvataggio norma Gap:', saveError)
      setError('Impossibile salvare la norma. Verifica i dati e riprova.')
    } finally {
      setSaving(false)
    }
  }

  const removeStandard = async (standard: GapStandard) => {
    if (!user?.id) return
    if (!confirm(`Eliminare la norma "${standard.code} - ${standard.name}"?`)) return

    setError(null)

    try {
      await deleteGapStandard(standard.id, user.id)
      setStandards((current) => current.filter((item) => item.id !== standard.id))
    } catch (deleteError) {
      console.error('Errore eliminazione norma Gap:', deleteError)
      setError('Impossibile eliminare la norma selezionata.')
    }
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title="Norme e standard"
        description="Catalogo dei riferimenti normativi e procedurali collegabili alle attivita Gap."
        eyebrow="Gap Analysis"
        icon={<BookMarked className="h-6 w-6" />}
        actions={(
          <Button type="button" tone="success" icon={<Plus className="h-4 w-4" />} onClick={startCreate}>
            Nuova norma
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
            <CardTitle>{editingStandard ? 'Modifica norma' : 'Nuova norma'}</CardTitle>
            <CardDescription>
              Inserisci un riferimento normativo o procedurale locale. I template globali non sono
              attivi in questa fase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveStandard} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Codice *</span>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                    className="clinical-input"
                    placeholder="Es. UNI-EN-ISO"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Nome *</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="clinical-input"
                    placeholder="Nome norma o procedura"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Versione</span>
                  <input
                    type="text"
                    value={form.version}
                    onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
                    className="clinical-input"
                    placeholder="Es. 2026"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Ente emittente</span>
                  <input
                    type="text"
                    value={form.issuing_body}
                    onChange={(event) => setForm((current) => ({ ...current, issuing_body: event.target.value }))}
                    className="clinical-input"
                    placeholder="Es. Ministero, Regione, Azienda"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">URL</span>
                <input
                  type="url"
                  value={form.url}
                  onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                  className="clinical-input"
                  placeholder="https://..."
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Descrizione</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="clinical-input min-h-28 resize-y"
                  placeholder="Ambito di applicazione, note operative o riferimenti specifici."
                />
              </label>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button type="button" variant="outline" tone="neutral" onClick={resetForm}>
                  Annulla
                </Button>
                <Button type="submit" tone="success" loading={saving}>
                  {editingStandard ? 'Salva modifiche' : 'Crea norma'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="clinical-input py-2 pl-10 pr-4"
                placeholder="Cerca per codice o nome..."
              />
            </div>

            <select
              value={issuingBodyFilter}
              onChange={(event) => setIssuingBodyFilter(event.target.value)}
              className="clinical-input px-4 py-2 lg:w-64"
            >
              <option value="all">Tutti gli enti</option>
              {issuingBodies.map((body) => (
                <option key={body} value={body}>
                  {body}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            Caricamento norme...
          </CardContent>
        </Card>
      ) : standards.length === 0 ? (
        <EmptyState
          icon={<BookMarked className="h-6 w-6" />}
          title="Nessuna norma disponibile"
          description="Crea il primo riferimento normativo o procedurale da usare nel modulo Gap Analysis."
          action={(
            <Button type="button" tone="success" icon={<Plus className="h-4 w-4" />} onClick={startCreate}>
              Crea norma
            </Button>
          )}
        />
      ) : filteredStandards.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Nessuna norma trovata"
          description="Modifica ricerca o filtro ente per visualizzare altri riferimenti."
        />
      ) : (
        <div className="grid gap-4">
          {filteredStandards.map((standard) => (
            <Card key={standard.id} className="transition hover:shadow-clinical">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="success">{standard.code}</Badge>
                      <Badge variant="neutral">Locale</Badge>
                      {standard.version && <Badge variant="info">Versione {standard.version}</Badge>}
                    </div>
                    <h2 className="mt-3 text-base font-semibold text-slate-900">{standard.name}</h2>
                    {standard.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-500">{standard.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Ente: {standard.issuing_body || 'N/D'}</span>
                      <span>Aggiornata il {formatDate(standard.updated_at)}</span>
                    </div>
                    {standard.url && (
                      <a
                        href={standard.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800"
                      >
                        Apri riferimento
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      tone="neutral"
                      size="sm"
                      icon={<Edit3 className="h-4 w-4" />}
                      onClick={() => startEdit(standard)}
                    >
                      Modifica
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      tone="risk"
                      size="sm"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => removeStandard(standard)}
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
