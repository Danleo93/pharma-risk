import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, CheckSquare, Edit3, Plus, Save, Trash2 } from 'lucide-react'
import { isGapActionOverdue } from '../../lib/gapScoring'
import {
  GAP_ACTION_PHASE_OPTIONS,
  GAP_ACTION_PRIORITY_OPTIONS,
  GAP_ACTION_STATUS_OPTIONS,
  getGapActionPriorityColor,
  getGapActionPriorityLabel,
  getGapActionStatusColor,
  getGapActionStatusLabel,
} from '../../lib/labels'
import {
  createGapAction,
  deleteGapAction,
  updateGapAction,
  type GapActionInput,
} from '../../services/gapService'
import type {
  GapAction,
  GapActionPhase,
  GapActionPriority,
  GapActionStatus,
  GapActivityEvaluation,
  GapAssessment,
} from '../../types/gap'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

interface GapActionPlanTabProps {
  assessment: GapAssessment
  evaluations: GapActivityEvaluation[]
  actions: GapAction[]
  userId: string
  onActionsChange: (actions: GapAction[]) => void
}

type ActionStatusFilter = 'all' | GapActionStatus
type ActionPriorityFilter = 'all' | GapActionPriority

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

const actionStatuses = GAP_ACTION_STATUS_OPTIONS.filter((option) =>
  !['verified', 'ineffective'].includes(option.value),
)

const actionableComplianceStatuses = ['non_compliant', 'partially_compliant']

const emptyForm = (evaluationId = ''): ActionFormState => ({
  evaluation_id: evaluationId,
  description: '',
  responsible: '',
  priority: 'medium',
  status: 'planned',
  progress: '0',
  phase: '',
  planned_start_date: '',
  planned_end_date: '',
  notes: '',
})

const formFromAction = (action: GapAction): ActionFormState => ({
  evaluation_id: action.evaluation_id,
  description: action.description,
  responsible: action.responsible || '',
  priority: action.priority,
  status: action.status,
  progress: String(action.progress ?? 0),
  phase: action.phase || '',
  planned_start_date: action.planned_start_date || '',
  planned_end_date: action.planned_end_date || '',
  notes: action.notes || '',
})

const toNullable = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const toActionInput = (form: ActionFormState): GapActionInput => ({
  description: form.description.trim(),
  responsible: toNullable(form.responsible),
  priority: form.priority,
  status: form.status,
  progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
  phase: form.phase || null,
  planned_start_date: toNullable(form.planned_start_date),
  planned_end_date: toNullable(form.planned_end_date),
  notes: toNullable(form.notes),
})

const formatDate = (value: string | null) => {
  return value ? new Date(value).toLocaleDateString('it-IT') : 'N/D'
}

function ActionForm({
  form,
  evaluations,
  loading,
  submitLabel,
  onChange,
  onCancel,
  onSubmit,
}: {
  form: ActionFormState
  evaluations: GapActivityEvaluation[]
  loading?: boolean
  submitLabel: string
  onChange: (patch: Partial<ActionFormState>) => void
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Gap / Attivita collegata *
          </span>
          <select
            value={form.evaluation_id}
            onChange={(event) => onChange({ evaluation_id: event.target.value })}
            className="clinical-input bg-white"
            required
          >
            {evaluations.map((evaluation) => (
              <option key={evaluation.id} value={evaluation.id}>
                {evaluation.activity_code_snapshot || 'Senza codice'} - {evaluation.activity_name_snapshot || 'Attivita/Requisito'}
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
            placeholder="Descrivi l intervento correttivo o di adeguamento."
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
            <option value="">N/D</option>
            {GAP_ACTION_PHASE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Priorita</span>
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
            {actionStatuses.map((option) => (
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
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Annulla
        </button>
        <Button type="submit" tone="success" loading={loading} icon={<Save className="h-4 w-4" />}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export function GapActionPlanTab({
  assessment,
  evaluations,
  actions,
  userId,
  onActionsChange,
}: GapActionPlanTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<ActionFormState>(() => emptyForm(evaluations[0]?.id || ''))
  const [editingActionId, setEditingActionId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ActionFormState | null>(null)
  const [statusFilter, setStatusFilter] = useState<ActionStatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<ActionPriorityFilter>('all')
  const [responsibleFilter, setResponsibleFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const firstEvaluationId = evaluations[0]?.id || ''

    setCreateForm((current) => {
      if (current.evaluation_id && evaluations.some((evaluation) => evaluation.id === current.evaluation_id)) {
        return current
      }

      return {
        ...current,
        evaluation_id: firstEvaluationId,
      }
    })
  }, [evaluations])

  const evaluationById = useMemo(() => {
    return evaluations.reduce<Record<string, GapActivityEvaluation>>((acc, evaluation) => ({
      ...acc,
      [evaluation.id]: evaluation,
    }), {})
  }, [evaluations])

  const responsibleOptions = useMemo(() => {
    return Array.from(new Set(actions.map((action) => action.responsible).filter(Boolean) as string[]))
      .sort((a, b) => a.localeCompare(b))
  }, [actions])

  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      const matchesStatus = statusFilter === 'all' || action.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || action.priority === priorityFilter
      const matchesResponsible = responsibleFilter === 'all' || action.responsible === responsibleFilter

      return matchesStatus && matchesPriority && matchesResponsible
    })
  }, [actions, priorityFilter, responsibleFilter, statusFilter])

  const sortActions = (nextActions: GapAction[]) => {
    return [...nextActions].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  const resetCreateForm = () => {
    setCreateForm(emptyForm(evaluations[0]?.id || ''))
    setShowCreateForm(false)
  }

  const createAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const evaluation = evaluationById[createForm.evaluation_id]
    if (!evaluation) {
      setError('Seleziona un gap valido prima di creare l azione.')
      return
    }

    if (!actionableComplianceStatuses.includes(evaluation.compliance_status)) {
      setError('Le azioni correttive possono essere create solo da gap non conformi o parzialmente conformi.')
      return
    }

    if (!createForm.description.trim()) {
      setError('La descrizione dell azione e obbligatoria.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const created = await createGapAction(
        userId,
        assessment.id,
        evaluation,
        toActionInput(createForm),
      )
      onActionsChange(sortActions([created, ...actions]))
      resetCreateForm()
    } catch (createError) {
      console.error('Errore creazione azione Gap:', createError)
      setError('Impossibile creare l azione correttiva Gap.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (action: GapAction) => {
    setEditingActionId(action.id)
    setEditForm(formFromAction(action))
    setShowCreateForm(false)
  }

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingActionId || !editForm) return

    if (!editForm.description.trim()) {
      setError('La descrizione dell azione e obbligatoria.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const updated = await updateGapAction(editingActionId, userId, toActionInput(editForm))
      onActionsChange(sortActions(actions.map((action) => (
        action.id === updated.id ? updated : action
      ))))
      setEditingActionId(null)
      setEditForm(null)
    } catch (updateError) {
      console.error('Errore aggiornamento azione Gap:', updateError)
      setError('Impossibile aggiornare l azione correttiva Gap.')
    } finally {
      setSaving(false)
    }
  }

  const removeAction = async (action: GapAction) => {
    const confirmed = confirm(`Eliminare l azione "${action.description}"?`)
    if (!confirmed) return

    setDeletingActionId(action.id)
    setError(null)

    try {
      await deleteGapAction(action.id, userId)
      onActionsChange(actions.filter((item) => item.id !== action.id))
    } catch (deleteError) {
      console.error('Errore eliminazione azione Gap:', deleteError)
      setError('Impossibile eliminare l azione correttiva Gap.')
    } finally {
      setDeletingActionId(null)
    }
  }

  if (evaluations.length === 0) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-6 w-6" />}
        title="Nessun gap azionabile"
        description="Le azioni correttive possono essere create solo da valutazioni non conformi o parzialmente conformi."
      />
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader
          actions={(
            <Button
              type="button"
              tone="success"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setShowCreateForm(true)
                setEditingActionId(null)
                setEditForm(null)
              }}
            >
              Nuova azione
            </Button>
          )}
        >
          <CardTitle>Azioni correttive</CardTitle>
          <CardDescription>
            Piano tabellare delle azioni collegate ai gap non conformi o parzialmente conformi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCreateForm && (
            <ActionForm
              form={createForm}
              evaluations={evaluations}
              loading={saving}
              submitLabel="Crea azione"
              onChange={(patch) => setCreateForm((current) => ({ ...current, ...patch }))}
              onCancel={resetCreateForm}
              onSubmit={createAction}
            />
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Stato</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ActionStatusFilter)}
                className="clinical-input"
              >
                <option value="all">Tutti</option>
                {actionStatuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Priorita</span>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as ActionPriorityFilter)}
                className="clinical-input"
              >
                <option value="all">Tutte</option>
                {GAP_ACTION_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
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
                  <option key={responsible} value={responsible}>
                    {responsible}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      {filteredActions.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-6 w-6" />}
          title={actions.length === 0 ? 'Nessuna azione correttiva' : 'Nessuna azione corrisponde ai filtri'}
          description={actions.length === 0
            ? 'Crea una nuova azione partendo da un gap non conforme o parzialmente conforme.'
            : 'Modifica i filtri per visualizzare altre azioni.'}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr_0.8fr_1fr_auto] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 xl:grid">
            <span>Descrizione</span>
            <span>Gap collegato</span>
            <span>Responsabile/i</span>
            <span>Priorita</span>
            <span>Stato</span>
            <span>Progress</span>
            <span>Scadenza</span>
            <span>Azioni</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredActions.map((action) => {
              const evaluation = evaluationById[action.evaluation_id]
              const overdue = isGapActionOverdue(action)
              const editing = editingActionId === action.id && editForm

              return (
                <div key={action.id} className="p-4">
                  {editing ? (
                    <ActionForm
                      form={editForm}
                      evaluations={evaluations}
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
                    <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr_0.8fr_1fr_auto] xl:items-start">
                      <div>
                        <p className="font-semibold text-slate-950">{action.description}</p>
                        {action.notes && (
                          <p className="mt-1 text-sm leading-6 text-slate-500">{action.notes}</p>
                        )}
                        {action.phase && (
                          <p className="mt-2 text-xs text-slate-400">
                            Fase: {GAP_ACTION_PHASE_OPTIONS.find((option) => option.value === action.phase)?.label || action.phase}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-slate-600">
                        <p className="font-medium text-slate-800">
                          {evaluation?.activity_code_snapshot || 'N/D'}
                        </p>
                        <p className="mt-1 leading-5">
                          {evaluation?.activity_name_snapshot || 'Attivita/Requisito non disponibile'}
                        </p>
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
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        {action.progress}%
                      </div>
                      <div className="text-sm text-slate-600">
                        <p>{formatDate(action.planned_start_date)} - {formatDate(action.planned_end_date)}</p>
                        {overdue && (
                          <span className="mt-2 inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Scaduta
                          </span>
                        )}
                      </div>
                      <div className="flex justify-start gap-2 xl:justify-end">
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
