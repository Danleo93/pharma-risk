import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, Edit3, ExternalLink, Plus, Save, Search, ShieldCheck, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { isGapActionOverdue } from '../../lib/gapScoring'
import {
  GAP_ACTION_PHASE_OPTIONS,
  GAP_ACTION_PRIORITY_OPTIONS,
  GAP_ACTION_STATUS_OPTIONS,
  GAP_VERIFICATION_RESULT_OPTIONS,
  getGapActionPriorityColor,
  getGapActionPriorityLabel,
  getGapActionStatusColor,
  getGapActionStatusLabel,
  getGapVerificationResultColor,
  getGapVerificationResultLabel,
} from '../../lib/labels'
import {
  completeGapAction,
  createGapAction,
  createGapActionEvent,
  deleteGapAction,
  getGapActions,
  getGapAssessments,
  getGapEvaluations,
  updateGapAction,
  type GapActionInput,
  type GapActionUpdateInput,
} from '../../services/gapService'
import type {
  GapAction,
  GapActionPhase,
  GapActionPriority,
  GapActionStatus,
  GapActivityEvaluation,
  GapAssessment,
  GapVerificationResult,
} from '../../types/gap'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'

type StatusFilter = 'all' | GapActionStatus
type PriorityFilter = 'all' | GapActionPriority
type VerificationFilter = 'all' | GapVerificationResult
type OverdueFilter = 'all' | 'overdue' | 'not_overdue'

interface ActionFormState {
  evaluation_id: string
  description: string
  responsible: string
  priority: GapActionPriority
  status: GapActionStatus
  progress: string
  phase: '' | GapActionPhase
  planned_start_date: string
  planned_end_date: string
  notes: string
}

const actionableComplianceStatuses = ['non_compliant', 'partially_compliant']
const editableActionStatuses = GAP_ACTION_STATUS_OPTIONS.filter((option) =>
  !['verified', 'ineffective'].includes(option.value),
)

const formatDate = (value: string | null) => {
  return value ? new Date(value).toLocaleDateString('it-IT') : 'N/D'
}

const toNullable = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const emptyForm = (evaluationId = ''): ActionFormState => ({
  evaluation_id: evaluationId,
  description: '',
  responsible: '',
  priority: 'medium',
  status: 'planned',
  progress: '0',
  phase: 'planning',
  planned_start_date: '',
  planned_end_date: '',
  notes: '',
})

const formFromAction = (action: GapAction): ActionFormState => ({
  evaluation_id: action.evaluation_id,
  description: action.description,
  responsible: action.responsible || '',
  priority: action.priority,
  status: action.status === 'closed' ? 'verified' : action.status,
  progress: String(action.progress ?? 0),
  phase: action.phase || 'planning',
  planned_start_date: action.planned_start_date || '',
  planned_end_date: action.planned_end_date || '',
  notes: action.notes || '',
})

const toActionInput = (form: ActionFormState): GapActionInput => ({
  description: form.description.trim(),
  responsible: toNullable(form.responsible),
  priority: form.priority,
  status: form.status,
  progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
  phase: form.phase || 'planning',
  planned_start_date: toNullable(form.planned_start_date),
  planned_end_date: toNullable(form.planned_end_date),
  notes: toNullable(form.notes),
})

const toActionUpdateInput = (
  form: ActionFormState,
  evaluation: Pick<GapActivityEvaluation, 'id' | 'activity_id' | 'assessment_id'>,
): GapActionUpdateInput => ({
  ...toActionInput(form),
  assessment_id: evaluation.assessment_id,
  activity_id: evaluation.activity_id,
  evaluation_id: evaluation.id,
})

const evaluationLabel = (
  evaluation: GapActivityEvaluation,
  assessment?: GapAssessment,
) => {
  const activity = `${evaluation.activity_code_snapshot || 'Senza codice'} - ${evaluation.activity_name_snapshot || 'Attività/Requisito'}`
  return assessment?.title ? `${assessment.title} · ${activity}` : activity
}

function ActionForm({
  form,
  evaluations,
  assessmentById,
  loading,
  submitLabel,
  onChange,
  onCancel,
  onSubmit,
}: {
  form: ActionFormState
  evaluations: GapActivityEvaluation[]
  assessmentById: Record<string, GapAssessment>
  loading?: boolean
  submitLabel: string
  onChange: (patch: Partial<ActionFormState>) => void
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const statusOptions = editableActionStatuses.some((option) => option.value === form.status)
    ? editableActionStatuses
    : [
        ...editableActionStatuses,
        { value: form.status, label: getGapActionStatusLabel(form.status) },
      ]

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
      {evaluations.length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          Non ci sono gap azionabili. Le azioni correttive possono essere collegate solo ad Attività/Requisiti non conformi o parzialmente conformi.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Gap / Attività-Requisito collegata *
          </span>
          <select
            value={form.evaluation_id}
            onChange={(event) => onChange({ evaluation_id: event.target.value })}
            className="clinical-input bg-white"
            required
            disabled={evaluations.length === 0}
          >
            {evaluations.map((evaluation) => (
              <option key={evaluation.id} value={evaluation.id}>
                {evaluationLabel(evaluation, assessmentById[evaluation.assessment_id])}
              </option>
            ))}
          </select>
        </label>

        <label className="block lg:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Descrizione azione *</span>
          <textarea
            value={form.description}
            onChange={(event) => onChange({ description: event.target.value })}
            className="clinical-input min-h-24 resize-y bg-white"
            placeholder="Descrivi l'intervento correttivo o di adeguamento."
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Responsabile/i</span>
          <input
            type="text"
            value={form.responsible}
            onChange={(event) => onChange({ responsible: event.target.value })}
            className="clinical-input bg-white"
            placeholder="Persona, team o funzione responsabile"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Fase</span>
          <select
            value={form.phase}
            onChange={(event) => onChange({ phase: event.target.value as '' | GapActionPhase })}
            className="clinical-input bg-white"
          >
            {GAP_ACTION_PHASE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Priorità</span>
          <select
            value={form.priority}
            onChange={(event) => onChange({ priority: event.target.value as GapActionPriority })}
            className="clinical-input bg-white"
          >
            {GAP_ACTION_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Stato</span>
          <select
            value={form.status}
            onChange={(event) => onChange({ status: event.target.value as GapActionStatus })}
            className="clinical-input bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Avanzamento %</span>
          <input
            type="number"
            min={0}
            max={100}
            value={form.progress}
            onChange={(event) => onChange({ progress: event.target.value })}
            className="clinical-input bg-white"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Inizio pianificato</span>
          <input
            type="date"
            value={form.planned_start_date}
            onChange={(event) => onChange({ planned_start_date: event.target.value })}
            className="clinical-input bg-white"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Fine pianificata</span>
          <input
            type="date"
            value={form.planned_end_date}
            onChange={(event) => onChange({ planned_end_date: event.target.value })}
            className="clinical-input bg-white"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Note</span>
          <textarea
            value={form.notes}
            onChange={(event) => onChange({ notes: event.target.value })}
            className="clinical-input min-h-20 resize-y bg-white"
            placeholder="Note operative, dipendenze o vincoli."
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" tone="neutral" onClick={onCancel}>
          Annulla
        </Button>
        <Button
          type="submit"
          tone="success"
          loading={loading}
          icon={<Save className="h-4 w-4" />}
          disabled={evaluations.length === 0}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default function GapActions() {
  const { user } = useAuth()
  const [actions, setActions] = useState<GapAction[]>([])
  const [assessments, setAssessments] = useState<GapAssessment[]>([])
  const [evaluations, setEvaluations] = useState<GapActivityEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<ActionFormState>(emptyForm())
  const [editingActionId, setEditingActionId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ActionFormState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [responsibleFilter, setResponsibleFilter] = useState('all')
  const [overdueFilter, setOverdueFilter] = useState<OverdueFilter>('all')
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user?.id) return

    let active = true

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [actionsData, assessmentsData, evaluationsData] = await Promise.all([
          getGapActions(user.id),
          getGapAssessments(user.id),
          getGapEvaluations(user.id),
        ])

        if (!active) return
        setActions(actionsData)
        setAssessments(assessmentsData)
        setEvaluations(evaluationsData)
      } catch (fetchError) {
        console.error('Errore caricamento azioni Gap:', fetchError)
        if (active) setError('Impossibile caricare il registro azioni Gap.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchData()

    return () => {
      active = false
    }
  }, [user?.id])

  const assessmentById = useMemo(() => {
    return assessments.reduce<Record<string, GapAssessment>>((acc, assessment) => ({
      ...acc,
      [assessment.id]: assessment,
    }), {})
  }, [assessments])

  const evaluationById = useMemo(() => {
    return evaluations.reduce<Record<string, GapActivityEvaluation>>((acc, evaluation) => ({
      ...acc,
      [evaluation.id]: evaluation,
    }), {})
  }, [evaluations])

  const actionableEvaluations = useMemo(() => {
    return evaluations
      .filter((evaluation) => actionableComplianceStatuses.includes(evaluation.compliance_status))
      .sort((a, b) => {
        const assessmentDiff = (assessmentById[a.assessment_id]?.title || '').localeCompare(
          assessmentById[b.assessment_id]?.title || '',
        )
        if (assessmentDiff !== 0) return assessmentDiff

        return (a.activity_code_snapshot || '').localeCompare(b.activity_code_snapshot || '')
      })
  }, [assessmentById, evaluations])

  useEffect(() => {
    setCreateForm((current) => {
      if (current.evaluation_id && actionableEvaluations.some((evaluation) => evaluation.id === current.evaluation_id)) {
        return current
      }

      return {
        ...current,
        evaluation_id: actionableEvaluations[0]?.id || '',
      }
    })
  }, [actionableEvaluations])

  const responsibleOptions = useMemo(() => {
    return Array.from(new Set(actions.map((action) => action.responsible).filter(Boolean) as string[]))
      .sort((a, b) => a.localeCompare(b))
  }, [actions])

  const stats = useMemo(() => {
    return {
      total: actions.length,
      open: actions.filter((action) => !['completed', 'verified', 'closed'].includes(action.status)).length,
      completed: actions.filter((action) => action.status === 'completed').length,
      verified: actions.filter((action) => action.status === 'verified').length,
      overdue: actions.filter((action) => isGapActionOverdue(action)).length,
      pendingVerification: actions.filter((action) =>
        action.status === 'completed' && action.verification_result === 'pending',
      ).length,
    }
  }, [actions])

  const filteredActions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return actions.filter((action) => {
      const overdue = isGapActionOverdue(action)
      const assessment = assessmentById[action.assessment_id]
      const evaluation = evaluationById[action.evaluation_id]
      const searchableText = [
        action.description,
        action.responsible,
        action.notes,
        assessment?.title,
        assessment?.department,
        assessment?.facility_name,
        evaluation?.activity_code_snapshot,
        evaluation?.activity_name_snapshot,
        evaluation?.area_name_snapshot,
      ].filter(Boolean).join(' ').toLowerCase()

      const matchesStatus = statusFilter === 'all' || action.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || action.priority === priorityFilter
      const matchesResponsible = responsibleFilter === 'all' || action.responsible === responsibleFilter
      const matchesVerification = verificationFilter === 'all' || action.verification_result === verificationFilter
      const matchesOverdue =
        overdueFilter === 'all' ||
        (overdueFilter === 'overdue' && overdue) ||
        (overdueFilter === 'not_overdue' && !overdue)
      const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch)

      return (
        matchesStatus &&
        matchesPriority &&
        matchesResponsible &&
        matchesVerification &&
        matchesOverdue &&
        matchesSearch
      )
    })
  }, [
    actions,
    assessmentById,
    evaluationById,
    overdueFilter,
    priorityFilter,
    responsibleFilter,
    search,
    statusFilter,
    verificationFilter,
  ])

  const sortActions = (nextActions: GapAction[]) => {
    return [...nextActions].sort((a, b) => {
      const endDiff = (a.planned_end_date || '9999-12-31').localeCompare(b.planned_end_date || '9999-12-31')
      if (endDiff !== 0) return endDiff
      return b.created_at.localeCompare(a.created_at)
    })
  }

  const resetCreateForm = (evaluationId = createForm.evaluation_id) => {
    setCreateForm(emptyForm(evaluationId || actionableEvaluations[0]?.id || ''))
    setShowCreateForm(false)
  }

  const createAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.id) return

    const evaluation = evaluationById[createForm.evaluation_id]
    if (!evaluation) {
      setError("Seleziona un gap valido prima di creare l'azione.")
      return
    }

    if (!actionableComplianceStatuses.includes(evaluation.compliance_status)) {
      setError('Le azioni correttive possono essere create solo da gap non conformi o parzialmente conformi.')
      return
    }

    if (!createForm.description.trim()) {
      setError("La descrizione dell'azione è obbligatoria.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const actionInput = toActionInput(createForm)
      const created = await createGapAction(user.id, evaluation.assessment_id, evaluation, actionInput)
      await createGapActionEvent(user.id, created, 'created', 'Azione correttiva creata.')
      const nextAction = created.status === 'completed'
        ? await completeGapAction(user.id, created, {
            ...actionInput,
            assessment_id: evaluation.assessment_id,
            activity_id: evaluation.activity_id,
            evaluation_id: evaluation.id,
          })
        : created

      setActions((current) => sortActions([nextAction, ...current]))
      resetCreateForm(createForm.evaluation_id)
    } catch (createError) {
      console.error('Errore creazione azione Gap:', createError)
      setError("Impossibile creare l'azione correttiva Gap.")
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (action: GapAction) => {
    setEditingActionId(action.id)
    setEditForm(formFromAction(action))
    setShowCreateForm(false)
    setError(null)
  }

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.id || !editingActionId || !editForm) return

    const currentAction = actions.find((action) => action.id === editingActionId)
    const selectedEvaluation = evaluationById[editForm.evaluation_id]

    if (!currentAction || !selectedEvaluation) {
      setError("Seleziona un gap valido prima di salvare l'azione.")
      return
    }

    if (!editForm.description.trim()) {
      setError("La descrizione dell'azione è obbligatoria.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const actionInput = toActionUpdateInput(editForm, selectedEvaluation)
      const updated = actionInput.status === 'completed' && currentAction.status !== 'completed'
        ? await completeGapAction(user.id, currentAction, actionInput)
        : await updateGapAction(editingActionId, user.id, actionInput)

      setActions((current) => sortActions(current.map((action) => (
        action.id === updated.id ? updated : action
      ))))
      setEditingActionId(null)
      setEditForm(null)
    } catch (updateError) {
      console.error('Errore aggiornamento azione Gap:', updateError)
      setError("Impossibile aggiornare l'azione correttiva Gap.")
    } finally {
      setSaving(false)
    }
  }

  const removeAction = async (action: GapAction) => {
    if (!user?.id) return
    const confirmed = confirm(`Eliminare l'azione "${action.description}"?`)
    if (!confirmed) return

    setDeletingActionId(action.id)
    setError(null)

    try {
      await deleteGapAction(action.id, user.id)
      setActions((current) => current.filter((item) => item.id !== action.id))
    } catch (deleteError) {
      console.error('Errore eliminazione azione Gap:', deleteError)
      setError("Impossibile eliminare l'azione correttiva Gap.")
    } finally {
      setDeletingActionId(null)
    }
  }

  const getEditEvaluationOptions = (action: GapAction) => {
    const currentEvaluation = evaluationById[action.evaluation_id]
    if (!currentEvaluation) return actionableEvaluations

    const options = actionableEvaluations.some((evaluation) => evaluation.id === currentEvaluation.id)
      ? actionableEvaluations
      : [currentEvaluation, ...actionableEvaluations]

    return options
  }

  if (loading) {
    return (
      <div className="clinical-page">
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            Caricamento registro azioni Gap...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title="Registro azioni Gap"
        description="Crea, aggiorna e monitora le azioni correttive collegate ai gap rilevati negli assessment."
        eyebrow="Gap Analysis"
        icon={<CheckSquare className="h-6 w-6" />}
        actions={(
          <Button
            type="button"
            tone="success"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setShowCreateForm((current) => !current)
              setEditingActionId(null)
              setEditForm(null)
              setError(null)
            }}
          >
            Nuova azione
          </Button>
        )}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Totale" value={stats.total} icon={<CheckSquare className="h-6 w-6" />} tone="clinical" />
        <StatCard label="Aperte" value={stats.open} icon={<CheckSquare className="h-6 w-6" />} tone="neutral" />
        <StatCard label="Completate" value={stats.completed} icon={<CheckSquare className="h-6 w-6" />} tone="success" />
        <StatCard label="Verificate" value={stats.verified} icon={<ShieldCheck className="h-6 w-6" />} tone="success" />
        <StatCard label="Scadute" value={stats.overdue} icon={<CheckSquare className="h-6 w-6" />} tone="risk" />
        <StatCard label="Verifica pending" value={stats.pendingVerification} icon={<ShieldCheck className="h-6 w-6" />} tone="neutral" />
      </div>

      {showCreateForm && (
        <Card className="mb-6 border-teal-100">
          <CardHeader>
            <CardTitle>Nuova azione correttiva</CardTitle>
            <CardDescription>
              Seleziona un gap non conforme o parzialmente conforme e pianifica l'azione correttiva.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm
              form={createForm}
              evaluations={actionableEvaluations}
              assessmentById={assessmentById}
              loading={saving}
              submitLabel="Crea azione"
              onChange={(patch) => setCreateForm((current) => ({ ...current, ...patch }))}
              onCancel={resetCreateForm}
              onSubmit={createAction}
            />
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtri registro</CardTitle>
          <CardDescription>
            Filtra il piano azioni per stato, priorità, Responsabile/i, scadenza e verifica efficacia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-6">
            <label className="block lg:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Cerca</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="clinical-input pl-9"
                  placeholder="Descrizione, Responsabile/i, assessment..."
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Stato</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="clinical-input"
              >
                <option value="all">Tutti</option>
                {GAP_ACTION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Priorità</span>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
                className="clinical-input"
              >
                <option value="all">Tutte</option>
                {GAP_ACTION_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Responsabile/i</span>
              <select
                value={responsibleFilter}
                onChange={(event) => setResponsibleFilter(event.target.value)}
                className="clinical-input"
              >
                <option value="all">Tutti</option>
                {responsibleOptions.map((responsible) => (
                  <option key={responsible} value={responsible}>{responsible}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Scadenza</span>
              <select
                value={overdueFilter}
                onChange={(event) => setOverdueFilter(event.target.value as OverdueFilter)}
                className="clinical-input"
              >
                <option value="all">Tutte</option>
                <option value="overdue">Solo scadute</option>
                <option value="not_overdue">Non scadute</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Verifica</span>
              <select
                value={verificationFilter}
                onChange={(event) => setVerificationFilter(event.target.value as VerificationFilter)}
                className="clinical-input"
              >
                <option value="all">Tutte</option>
                {GAP_VERIFICATION_RESULT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      {actions.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-6 w-6" />}
          title="Nessuna azione Gap"
          description="Crea una nuova azione partendo da un gap non conforme o parzialmente conforme."
        />
      ) : filteredActions.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Nessuna azione corrisponde ai filtri"
          description="Modifica ricerca o filtri per visualizzare altre azioni."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.35fr_1fr_1fr_0.9fr_0.8fr_0.8fr_1fr_1fr_auto] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 xl:grid">
            <span>Descrizione</span>
            <span>Assessment</span>
            <span>Gap collegato</span>
            <span>Responsabile/i</span>
            <span>Priorità</span>
            <span>Stato</span>
            <span>Date</span>
            <span>Verifica</span>
            <span>Azioni</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredActions.map((action) => {
              const assessment = assessmentById[action.assessment_id]
              const evaluation = evaluationById[action.evaluation_id]
              const overdue = isGapActionOverdue(action)
              const phaseLabel = GAP_ACTION_PHASE_OPTIONS.find((option) => option.value === action.phase)?.label
              const editing = editingActionId === action.id && editForm
              const editEvaluationOptions = getEditEvaluationOptions(action)

              return (
                <div key={action.id} className="p-4">
                  {editing ? (
                    <ActionForm
                      form={editForm}
                      evaluations={editEvaluationOptions}
                      assessmentById={assessmentById}
                      loading={saving}
                      submitLabel="Salva modifiche"
                      onChange={(patch) => setEditForm((current) => current ? { ...current, ...patch } : current)}
                      onCancel={() => {
                        setEditingActionId(null)
                        setEditForm(null)
                      }}
                      onSubmit={saveEdit}
                    />
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr_1fr_0.9fr_0.8fr_0.8fr_1fr_1fr_auto] xl:items-start">
                      <div>
                        <p className="font-semibold text-slate-950">{action.description}</p>
                        {phaseLabel && (
                          <p className="mt-2 text-xs text-slate-500">Fase: {phaseLabel}</p>
                        )}
                        {action.notes && (
                          <p className="mt-1 text-sm leading-6 text-slate-500">{action.notes}</p>
                        )}
                      </div>

                      <div className="text-sm text-slate-600">
                        <p className="font-medium text-slate-800">{assessment?.title || 'Assessment non disponibile'}</p>
                        {assessment?.department && (
                          <p className="mt-1 text-xs text-slate-500">{assessment.department}</p>
                        )}
                      </div>

                      <div className="text-sm text-slate-600">
                        <p className="font-medium text-slate-800">{evaluation?.activity_code_snapshot || 'N/D'}</p>
                        <p className="mt-1 leading-5">{evaluation?.activity_name_snapshot || 'Attività/Requisito non disponibile'}</p>
                        {evaluation?.area_name_snapshot && (
                          <p className="mt-1 text-xs text-slate-500">{evaluation.area_name_snapshot}</p>
                        )}
                      </div>

                      <div className="text-sm text-slate-600">
                        {action.responsible || 'Non assegnato'}
                      </div>

                      <div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getGapActionPriorityColor(action.priority)}`}>
                          {getGapActionPriorityLabel(action.priority)}
                        </span>
                      </div>

                      <div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getGapActionStatusColor(action.status)}`}>
                          {getGapActionStatusLabel(action.status)}
                        </span>
                        <p className="mt-2 text-xs font-semibold text-slate-500">{action.progress}%</p>
                      </div>

                      <div className="text-sm text-slate-600">
                        <p>{formatDate(action.planned_start_date)} - {formatDate(action.planned_end_date)}</p>
                        {overdue && (
                          <span className="mt-2 inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Scaduta
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-slate-600">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getGapVerificationResultColor(action.verification_result)}`}>
                          {getGapVerificationResultLabel(action.verification_result)}
                        </span>
                        {action.verification_due_date && (
                          <p className="mt-2 text-xs text-slate-500">Entro: {formatDate(action.verification_due_date)}</p>
                        )}
                        {action.verified_at && (
                          <p className="mt-1 text-xs text-slate-500">Verificata: {new Date(action.verified_at).toLocaleDateString('it-IT')}</p>
                        )}
                      </div>

                      <div className="flex justify-start gap-2 xl:justify-end">
                        <Link
                          to={`/gap/assessment/${action.assessment_id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-teal-100 bg-white text-teal-700 transition hover:bg-teal-50"
                          aria-label="Apri assessment collegato"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEdit(action)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                          aria-label="Modifica azione"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAction(action)}
                          disabled={deletingActionId === action.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Elimina azione"
                        >
                          {deletingActionId === action.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
