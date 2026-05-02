import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckSquare, Layers3, Plus, Workflow } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  createGapActivityEvaluationsForAssessment,
  createGapAssessment,
  createGapAssessmentProcess,
  getGapProcessesWithStructure,
  updateGapAssessmentEvaluationCounts,
  type GapActivityEvaluationInput,
  type GapProcessWithStructure,
} from '../../services/gapService'
import type { GapAssessment } from '../../types/gap'
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

const toNullable = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
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

  const toggleProcess = (processId: string) => {
    setSelectedProcessIds((current) => {
      const next = current.includes(processId)
        ? current.filter((id) => id !== processId)
        : [...current, processId]

      setSelectionWarning(next.length === 0 ? noProcessSelectionMessage : null)
      return next
    })
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
      setError('Il titolo assessment e obbligatorio.')
      return
    }

    if (selectedProcesses.length === 0) {
      setError(null)
      setSelectionWarning(noProcessSelectionMessage)
      return
    }

    if (evaluationSnapshots.length === 0) {
      setError(
        'Non e possibile creare un assessment senza Attivita/Requisiti. Aggiungi Attivita/Requisiti alla libreria oppure crea prima un nuovo macro-processo completo.',
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
          ? 'Assessment creato, ma uno step successivo non e riuscito. Verifica la lista assessment e riprova manualmente se necessario.'
          : 'Impossibile creare l assessment Gap. Verifica i dati e riprova.',
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
        description="Per creare un assessment Gap devi prima definire almeno un macro-processo con Domini/Sezioni e Attivita/Requisiti."
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
            Definisci il perimetro dell assessment Gap prima di selezionare i processi.
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
              <span className="mb-1 block text-sm font-medium text-slate-700">Reparto / Unita</span>
              <input
                type="text"
                value={form.department}
                onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                className="clinical-input"
                placeholder="Reparto o unita operativa"
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
                placeholder="Obiettivo, perimetro e note dell assessment."
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Processi da includere</CardTitle>
          <CardDescription>
            Ogni processo selezionato includera automaticamente tutti i Domini/Sezioni e le Attivita/Requisiti presenti in libreria.
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attivita/Requisiti</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{evaluationSnapshots.length}</p>
            </div>
          </div>

          {selectedProcessesWithoutActivities.length > 0 && evaluationSnapshots.length > 0 && (
            <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              Alcuni processi selezionati non contengono Attivita/Requisiti e verranno inclusi solo come riferimento:
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
                <button
                  key={process.id}
                  type="button"
                  onClick={() => toggleProcess(process.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    selected
                      ? 'border-teal-200 bg-teal-50 shadow-clinical-soft'
                      : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/50'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={selected ? 'success' : 'neutral'}>{process.code}</Badge>
                        {selected && <Badge variant="success">Selezionato</Badge>}
                        {activitiesCount === 0 && <Badge variant="warning">Nessuna Attivita/Requisito</Badge>}
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
                        {activitiesCount} Attivita/Requisiti
                      </span>
                    </div>
                  </div>
                </button>
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
