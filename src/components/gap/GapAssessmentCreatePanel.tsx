import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckSquare, Layers3, Plus, Workflow } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  createGapActivity,
  createGapActivityEvaluationsForAssessment,
  createGapArea,
  createGapAssessment,
  createGapAssessmentProcess,
  getGapProcessesWithStructure,
  updateGapAssessmentEvaluationCounts,
  type GapActivityEvaluationInput,
  type GapAreaWithActivities,
  type GapProcessWithStructure,
} from '../../services/gapService'
import type { GapAssessment } from '../../types/gap'
import { GapInlineActivityForm, type GapInlineActivityFormPayload } from './GapInlineActivityForm'
import { GapInlineDomainForm, type GapInlineDomainFormPayload } from './GapInlineDomainForm'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

interface GapAssessmentFormState {
  title: string
  description: string
  facility_name: string
  department: string
  assessor: string
  assessment_date: string
}

interface GapAssessmentCreatePanelProps {
  onCancel?: () => void
  onCreated?: (assessment: GapAssessment) => void
}

const today = new Date().toISOString().split('T')[0]

const emptyForm: GapAssessmentFormState = {
  title: '',
  description: '',
  facility_name: '',
  department: '',
  assessor: '',
  assessment_date: today,
}

const noProcessSelectionMessage =
  'Seleziona almeno un processo da includere nell’assessment. Oppure crea prima un nuovo macro-processo nella libreria.'

const normalizedNoProcessSelectionMessage =
  noProcessSelectionMessage.replace(/nell\S*assessment/, "nell'assessment")

const toNullable = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const formatDomainDescription = (payload: GapInlineDomainFormPayload) => {
  const operationalContext = payload.operational_context.trim()
  const description = payload.description.trim()

  if (operationalContext && description) {
    return `Contesto operativo: ${operationalContext}\n\nDescrizione:\n${description}`
  }

  if (operationalContext) {
    return `Contesto operativo: ${operationalContext}`
  }

  return description
}

const getPayloadOrderIndex = (
  value: string,
  fallback: number,
) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const buildEvaluationSnapshots = (
  selectedProcesses: GapProcessWithStructure[],
): GapActivityEvaluationInput[] => {
  const evaluationsByActivity = new Map<string, GapActivityEvaluationInput>()

  selectedProcesses.forEach((process) => {
    process.areas.forEach((area) => {
      area.activities.forEach((activity) => {
        if (evaluationsByActivity.has(activity.id)) return

        evaluationsByActivity.set(activity.id, {
          activity_id: activity.id,
          process_name_snapshot: process.name,
          area_name_snapshot: area.name,
          activity_name_snapshot: activity.name,
          activity_code_snapshot: activity.code,
        })
      })
    })
  })

  return Array.from(evaluationsByActivity.values())
}

export function GapAssessmentCreatePanel({
  onCancel,
  onCreated,
}: GapAssessmentCreatePanelProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<GapAssessmentFormState>(emptyForm)
  const [processes, setProcesses] = useState<GapProcessWithStructure[]>([])
  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null)
  const [domainFormProcessId, setDomainFormProcessId] = useState<string | null>(null)
  const [activityFormAreaId, setActivityFormAreaId] = useState<string | null>(null)
  const [savingDomainProcessId, setSavingDomainProcessId] = useState<string | null>(null)
  const [savingActivityAreaId, setSavingActivityAreaId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const fetchProcesses = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getGapProcessesWithStructure(user.id)
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

  const selectedProcesses = useMemo(
    () => processes.filter((process) => selectedProcessIds.includes(process.id)),
    [processes, selectedProcessIds],
  )

  const evaluationSnapshots = useMemo(
    () => buildEvaluationSnapshots(selectedProcesses),
    [selectedProcesses],
  )

  const selectedProcessesWithoutActivities = selectedProcesses.filter(
    (process) => process.total_activities === 0,
  )

  const getNextOrderIndex = (items: Array<{ order_index: number }>) => {
    return items.length > 0
      ? Math.max(...items.map((item) => item.order_index || 0)) + 1
      : 1
  }

  const getNextActivityCode = (area: GapAreaWithActivities) => {
    const prefix = `${area.code}-`
    const maxSuffix = area.activities.reduce((max, activity) => {
      if (!activity.code.startsWith(prefix)) return max

      const suffix = activity.code.slice(prefix.length)
      const numericSuffix = /^\d+$/.test(suffix) ? Number(suffix) : 0
      return Math.max(max, numericSuffix)
    }, 0)

    if (maxSuffix >= 99) return null
    return `${prefix}${String(maxSuffix + 1).padStart(2, '0')}`
  }

  const findAreaContext = (areaId: string) => {
    for (const process of processes) {
      const area = process.areas.find((item) => item.id === areaId)
      if (area) return { process, area }
    }

    return null
  }

  const toggleProcess = (processId: string) => {
    setSelectedProcessIds((current) => {
      const next = current.includes(processId)
        ? current.filter((id) => id !== processId)
        : [...current, processId]

      setSelectionWarning(next.length === 0 ? normalizedNoProcessSelectionMessage : null)
      return next
    })
  }

  const addDomainToProcess = async (
    processId: string,
    payload: GapInlineDomainFormPayload,
  ) => {
    if (!user?.id) return

    const process = processes.find((item) => item.id === processId)
    if (!process) return

    if (!payload.code || !payload.name) {
      setError('Codice e nome del Dominio/Sezione sono obbligatori.')
      return
    }

    setSavingDomainProcessId(processId)
    setError(null)

    try {
      const area = await createGapArea(user.id, processId, {
        code: payload.code,
        name: payload.name,
        description: toNullable(formatDomainDescription(payload)),
        order_index: getPayloadOrderIndex(payload.order_index, getNextOrderIndex(process.areas)),
      })
      const areaWithActivities: GapAreaWithActivities = {
        ...area,
        activities: [],
      }

      setProcesses((current) => current.map((item) => (
        item.id === processId
          ? {
              ...item,
              areas: [...item.areas, areaWithActivities].sort((a, b) =>
                (a.order_index - b.order_index) || a.name.localeCompare(b.name),
              ),
            }
          : item
      )))
      setDomainFormProcessId(null)
    } catch (createError) {
      console.error('Errore creazione Dominio/Sezione Gap:', createError)
      setError('Impossibile creare il Dominio/Sezione nella libreria Gap.')
    } finally {
      setSavingDomainProcessId(null)
    }
  }

  const addActivityToArea = async (
    areaId: string,
    payload: GapInlineActivityFormPayload,
  ) => {
    if (!user?.id) return

    const context = findAreaContext(areaId)
    if (!context) return

    if (!payload.name) {
      setError("Il nome dell'Attività/Requisito è obbligatorio.")
      return
    }

    if (!payload.target_state.trim()) {
      setError("Il target atteso di riferimento è obbligatorio per creare una nuova Attività/Requisito.")
      return
    }

    const generatedCode = getNextActivityCode(context.area)
    if (!generatedCode) {
      setError('Non si possono inserire più di 99 Attività/Requisiti per Dominio/Sezione. Procedi con la creazione di un nuovo Dominio/Sezione.')
      return
    }

    setSavingActivityAreaId(areaId)
    setError(null)

    try {
      const activity = await createGapActivity(user.id, areaId, {
        code: generatedCode,
        name: payload.name,
        description: toNullable(payload.description),
        operator: toNullable(payload.operator),
        target_state: toNullable(payload.target_state),
        order_index: getNextOrderIndex(context.area.activities),
      })

      setProcesses((current) => current.map((process) => {
        if (process.id !== context.process.id) return process

        return {
          ...process,
          areas: process.areas.map((area) => (
            area.id === areaId
              ? {
                  ...area,
                  activities: [...area.activities, activity].sort((a, b) =>
                    (a.order_index - b.order_index) || a.name.localeCompare(b.name),
                  ),
                }
              : area
          )),
          total_activities: process.total_activities + 1,
        }
      }))
      setActivityFormAreaId(null)
    } catch (createError) {
      console.error('Errore creazione Attività/Requisito Gap:', createError)
      setError("Impossibile creare l'Attività/Requisito nella libreria Gap.")
    } finally {
      setSavingActivityAreaId(null)
    }
  }

  const handleCreated = (assessment: GapAssessment) => {
    if (onCreated) {
      onCreated(assessment)
      return
    }

    navigate(`/gap/assessment/${assessment.id}`)
  }

  const createAssessment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.id) return

    if (!form.title.trim()) {
      setError("Il titolo assessment è obbligatorio.")
      return
    }

    if (selectedProcesses.length === 0) {
      setError(null)
      setSelectionWarning(normalizedNoProcessSelectionMessage)
      return
    }

    if (evaluationSnapshots.length === 0) {
      setError(
        'Non è possibile creare un assessment senza Attività/Requisiti. Aggiungi Attività/Requisiti alla libreria oppure crea prima un nuovo macro-processo completo.',
      )
      return
    }

    setCreating(true)
    setError(null)
    setSelectionWarning(null)

    let createdAssessmentId: string | null = null

    try {
      const assessment = await createGapAssessment(user.id, {
        title: form.title.trim(),
        description: toNullable(form.description),
        facility_name: toNullable(form.facility_name),
        department: toNullable(form.department),
        assessor: toNullable(form.assessor),
        assessment_date: toNullable(form.assessment_date),
        total_activities: evaluationSnapshots.length,
      })
      createdAssessmentId = assessment.id

      await Promise.all(
        selectedProcesses.map((process) =>
          createGapAssessmentProcess(user.id, assessment.id, process.id),
        ),
      )

      const insertedEvaluations = await createGapActivityEvaluationsForAssessment(
        user.id,
        assessment.id,
        evaluationSnapshots,
      )

      const updatedAssessment = await updateGapAssessmentEvaluationCounts(
        assessment.id,
        user.id,
        insertedEvaluations.length,
      )

      handleCreated(updatedAssessment)
    } catch (createError) {
      console.error('Errore creazione assessment Gap:', createError)
      setError(
        createdAssessmentId
          ? 'Assessment creato, ma uno step successivo non è riuscito. Verifica la lista assessment e riprova manualmente se necessario.'
          : "Impossibile creare l'assessment Gap. Verifica i dati e riprova.",
      )
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-slate-500">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          Caricamento processi...
        </CardContent>
      </Card>
    )
  }

  if (processes.length === 0) {
    return (
      <EmptyState
        icon={<Layers3 className="h-6 w-6" />}
        title="Nessun macro-processo disponibile"
        description="Per creare un assessment Gap devi prima definire almeno un macro-processo con Domini/Sezioni e Attività/Requisiti."
        action={(
          <Link
            to="/gap/processes"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Crea macro-processo
          </Link>
        )}
      />
    )
  }

  return (
    <form onSubmit={createAssessment} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dati generali</CardTitle>
          <CardDescription>
            Definisci il perimetro dell'assessment Gap prima di selezionare i processi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Titolo *</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="clinical-input"
                placeholder="Es. Gap Analysis processo UFA"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Struttura</span>
              <input
                type="text"
                value={form.facility_name}
                onChange={(event) => setForm((current) => ({ ...current, facility_name: event.target.value }))}
                className="clinical-input"
                placeholder="Nome struttura"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Reparto / Unità</span>
              <input
                type="text"
                value={form.department}
                onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                className="clinical-input"
                placeholder="Reparto o unità operativa"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Assessor</span>
              <input
                type="text"
                value={form.assessor}
                onChange={(event) => setForm((current) => ({ ...current, assessor: event.target.value }))}
                className="clinical-input"
                placeholder="Responsabile valutazione"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Data assessment</span>
              <input
                type="date"
                value={form.assessment_date}
                onChange={(event) => setForm((current) => ({ ...current, assessment_date: event.target.value }))}
                className="clinical-input"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Descrizione</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="clinical-input min-h-28 resize-y"
                placeholder="Obiettivo, perimetro e note dell'assessment."
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          actions={(
            <Link
              to="/gap/processes"
              className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-50"
            >
              <Plus className="h-4 w-4" />
              Crea macro-processo
            </Link>
          )}
        >
          <CardTitle>Processi da includere</CardTitle>
          <CardDescription>
            Ogni processo selezionato includerà automaticamente tutti i Domini/Sezioni e le Attività/Requisiti presenti in libreria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectionWarning && (
            <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
              <span>{selectionWarning}</span>
              <Link
                to="/gap/processes"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-50"
              >
                <Plus className="h-4 w-4" />
                Crea macro-processo
              </Link>
            </div>
          )}

          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Processi selezionati</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{selectedProcesses.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Domini/Sezioni</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {selectedProcesses.reduce((sum, process) => sum + process.areas.length, 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attività/Requisiti</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{evaluationSnapshots.length}</p>
            </div>
          </div>

          {selectedProcessesWithoutActivities.length > 0 && (
            <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              Alcuni processi selezionati non contengono ancora Attività/Requisiti. Aggiungili qui sotto oppure verranno inclusi solo come riferimento:
              {' '}
              {selectedProcessesWithoutActivities.map((process) => process.name).join(', ')}.
            </div>
          )}

          <div className="grid gap-4">
            {processes.map((process) => {
              const selected = selectedProcessIds.includes(process.id)
              const domainsCount = process.areas.length
              const activitiesCount = process.total_activities

              return (
                <div
                  key={process.id}
                  className={`rounded-xl border transition ${
                    selected
                      ? 'border-teal-200 bg-teal-50 shadow-clinical-soft'
                      : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleProcess(process.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={selected ? 'success' : 'neutral'}>{process.code}</Badge>
                          {selected && <Badge variant="success">Selezionato</Badge>}
                          {activitiesCount === 0 && <Badge variant="warning">Nessuna Attività/Requisito</Badge>}
                        </div>
                        <h3 className="mt-3 font-semibold text-slate-900">{process.name}</h3>
                        {process.description && (
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                            {process.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          <Workflow className="h-3.5 w-3.5" />
                          {domainsCount} Domini/Sezioni
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          <CheckSquare className="h-3.5 w-3.5" />
                          {activitiesCount} Attività/Requisiti
                        </span>
                      </div>
                    </div>
                  </button>

                  {selected && (
                    <div className="space-y-4 border-t border-teal-100 bg-white/80 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Arricchisci libreria</p>
                          <p className="text-sm text-slate-500">
                            Aggiungi Domini/Sezioni e Attività/Requisiti prima di creare l'assessment.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDomainFormProcessId(process.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-50"
                        >
                          <Plus className="h-4 w-4" />
                          Aggiungi Dominio/Sezione
                        </button>
                      </div>

                      {domainFormProcessId === process.id && (
                        <GapInlineDomainForm
                          loading={savingDomainProcessId === process.id}
                          onCancel={() => setDomainFormProcessId(null)}
                          onSubmit={(payload) => addDomainToProcess(process.id, payload)}
                        />
                      )}

                      {process.areas.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                          Nessun Dominio/Sezione presente. Aggiungine uno per poter inserire Attività/Requisiti valutabili.
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {process.areas.map((area) => {
                            const nextCode = getNextActivityCode(area)
                            const limitReached = nextCode === null

                            return (
                              <div key={area.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant="neutral">{area.code}</Badge>
                                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                        {area.activities.length} Attività/Requisiti
                                      </span>
                                    </div>
                                    <h4 className="mt-2 font-semibold text-slate-900">{area.name}</h4>
                                    {area.description && (
                                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{area.description}</p>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setActivityFormAreaId(area.id)}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Aggiungi Attività/Requisito
                                  </button>
                                </div>

                                {area.activities.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {area.activities.map((activity) => (
                                      <span
                                        key={activity.id}
                                        className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                                      >
                                        {activity.code} - {activity.name}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {activityFormAreaId === area.id && (
                                  <div className="mt-4">
                                    <GapInlineActivityForm
                                      generatedCode={nextCode}
                                      limitReached={limitReached}
                                      loading={savingActivityAreaId === area.id}
                                      onCancel={() => setActivityFormAreaId(null)}
                                      onSubmit={(payload) => addActivityToArea(area.id, payload)}
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Annulla
          </button>
        ) : (
          <Link
            to="/gap/assessments"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Annulla
          </Link>
        )}
        <Button type="submit" tone="success" loading={creating}>
          Crea assessment
        </Button>
      </div>
    </form>
  )
}
