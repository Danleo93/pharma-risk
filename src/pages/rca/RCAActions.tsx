import { useEffect, useState } from 'react'
import { AlertCircle, Calendar, ClipboardCheck, FileText, Pencil, Trash2, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  RCA_ACTION_STATUS_FILTER_OPTIONS,
  RCA_ACTION_STATUS_OPTIONS,
  RCA_PRIORITY_OPTIONS,
  getRCAActionStatusColor,
  getRCAActionStatusLabel,
  getRCAPriorityColor,
  getRCAPriorityLabel,
  getRCASeverityColor,
  getRootCauseStatusColor,
  getRootCauseStatusLabel,
  normalizeRCAActionStatus,
  type RCAActionStatus as EditableRCAActionStatus,
  type RCAPriority,
  type RootCauseStatus,
} from '../../lib/labels'
import { Card, CardContent } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'

type RCAActionStatus = string

interface RCAActionWithRelations {
  id: string
  assessment_id: string
  cause_id: string | null
  user_id: string
  description: string
  responsible: string | null
  due_date: string | null
  status: RCAActionStatus
  priority: RCAPriority | null
  completion_date: string | null
  effectiveness_check: string | null
  notes: string | null
  created_at: string
  updated_at: string
  cause?: {
    description: string
    category: string | null
    is_root_cause: boolean
    root_cause_status: RootCauseStatus | null
    root_cause_confirmed_at: string | null
    root_cause_confirmation_notes: string | null
  } | null
  assessment?: {
    title: string
    event_title: string
    severity: string | null
    status: string
  } | null
}

const statusFilters = RCA_ACTION_STATUS_FILTER_OPTIONS
const actionStatusOptions = RCA_ACTION_STATUS_OPTIONS
const priorityOptions = RCA_PRIORITY_OPTIONS

export default function RCAActions() {
  const { user } = useAuth()
  const [actions, setActions] = useState<RCAActionWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | EditableRCAActionStatus>('all')
  const [updatingActionId, setUpdatingActionId] = useState<string | null>(null)
  const [editingActionId, setEditingActionId] = useState<string | null>(null)
  const [savingEditActionId, setSavingEditActionId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editResponsible, setEditResponsible] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editPriority, setEditPriority] = useState<'' | RCAPriority>('')
  const [editStatus, setEditStatus] = useState<EditableRCAActionStatus>('planned')

  useEffect(() => {
    if (!user) return
    fetchActions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchActions = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('rca_action_plans')
      .select(`
        *,
        cause:rca_causes(description, category, is_root_cause, root_cause_status, root_cause_confirmed_at, root_cause_confirmation_notes),
        assessment:rca_assessments(title, event_title, severity, status)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Errore caricamento azioni RCA:', fetchError)
      setError('Errore durante il caricamento delle azioni RCA')
    } else {
      setActions((data || []) as RCAActionWithRelations[])
    }

    setLoading(false)
  }

  const updateActionStatus = async (action: RCAActionWithRelations, nextStatus: EditableRCAActionStatus) => {
    if (!user || normalizeRCAActionStatus(action.status) === nextStatus) return

    setUpdatingActionId(action.id)
    setError(null)

    const nextCompletionDate =
      nextStatus === 'completed'
        ? action.completion_date || new Date().toISOString().split('T')[0]
        : action.completion_date

    const { data, error: updateError } = await supabase
      .from('rca_action_plans')
      .update({
        status: nextStatus,
        completion_date: nextCompletionDate,
      })
      .eq('id', action.id)
      .eq('user_id', user.id)
      .select(`
        *,
        cause:rca_causes(description, category, is_root_cause, root_cause_status, root_cause_confirmed_at, root_cause_confirmation_notes),
        assessment:rca_assessments(title, event_title, severity, status)
      `)
      .single()

    if (updateError) {
      console.error('Errore aggiornamento stato azione RCA:', updateError)
      setError('Errore durante l aggiornamento dello stato dell azione RCA')
      setUpdatingActionId(null)
      return
    }

    setActions((current) =>
      current.map((currentAction) =>
        currentAction.id === action.id ? data as RCAActionWithRelations : currentAction,
      ),
    )
    setUpdatingActionId(null)
  }

  const deleteAction = async (actionId: string) => {
    if (!user) return
    if (!confirm('Eliminare questa azione correttiva RCA?')) return

    const { error: deleteError } = await supabase
      .from('rca_action_plans')
      .delete()
      .eq('id', actionId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Errore eliminazione azione RCA:', deleteError)
      setError('Errore durante l eliminazione dell azione RCA')
      return
    }

    setActions((current) => current.filter((action) => action.id !== actionId))
  }

  const startEditAction = (action: RCAActionWithRelations) => {
    setEditingActionId(action.id)
    setError(null)
    setEditDescription(action.description)
    setEditResponsible(action.responsible || '')
    setEditDueDate(action.due_date || '')
    setEditPriority(action.priority || '')
    setEditStatus(normalizeRCAActionStatus(action.status))
  }

  const cancelEditAction = () => {
    setEditingActionId(null)
    setSavingEditActionId(null)
    setEditDescription('')
    setEditResponsible('')
    setEditDueDate('')
    setEditPriority('')
    setEditStatus('planned')
  }

  const saveEditedAction = async (action: RCAActionWithRelations) => {
    if (!user) return

    const description = editDescription.trim()
    if (!description) {
      setError('La descrizione dell azione e obbligatoria')
      return
    }

    setSavingEditActionId(action.id)
    setError(null)

    const nextCompletionDate =
      editStatus === 'completed'
        ? action.completion_date || new Date().toISOString().split('T')[0]
        : action.completion_date

    const { data, error: updateError } = await supabase
      .from('rca_action_plans')
      .update({
        description,
        responsible: editResponsible.trim() || null,
        due_date: editDueDate || null,
        priority: editPriority || null,
        status: editStatus,
        completion_date: nextCompletionDate,
      })
      .eq('id', action.id)
      .eq('user_id', user.id)
      .select(`
        *,
        cause:rca_causes(description, category, is_root_cause, root_cause_status, root_cause_confirmed_at, root_cause_confirmation_notes),
        assessment:rca_assessments(title, event_title, severity, status)
      `)
      .single()

    if (updateError) {
      console.error('Errore modifica azione RCA:', updateError)
      setError('Errore durante la modifica dell azione RCA')
      setSavingEditActionId(null)
      return
    }

    setActions((current) =>
      current.map((currentAction) =>
        currentAction.id === action.id ? data as RCAActionWithRelations : currentAction,
      ),
    )
    cancelEditAction()
  }

  const filteredActions = actions.filter((action) => {
    return filterStatus === 'all' || normalizeRCAActionStatus(action.status) === filterStatus
  })

  const stats = {
    total: actions.length,
    planned: actions.filter((action) => normalizeRCAActionStatus(action.status) === 'planned').length,
    inProgress: actions.filter((action) => normalizeRCAActionStatus(action.status) === 'in_progress').length,
    completed: actions.filter((action) => normalizeRCAActionStatus(action.status) === 'completed').length,
  }

  const renderRootCauseStatusBadge = (cause: RCAActionWithRelations['cause']) => {
    const label = getRootCauseStatusLabel(cause)
    if (!label) return null

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRootCauseStatusColor(cause)}`}>
        {label}
      </span>
    )
  }

  const formatDate = (date: string | null) => {
    return date ? new Date(date).toLocaleDateString('it-IT') : 'N/D'
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title="Azioni Correttive RCA"
        description="Monitora le azioni create dalle cause candidate negli assessment RCA."
        eyebrow="Analisi Reattiva"
        actions={(
          <button
            type="button"
            disabled
            title="Crea azioni dal dettaglio assessment RCA"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-200 px-5 py-3 font-medium text-slate-500"
          >
            Nuova Azione
          </button>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Totale" value={stats.total} icon={<ClipboardCheck className="w-6 h-6" />} tone="rca" />
        <StatCard label="Pianificate" value={stats.planned} icon={<AlertCircle className="w-6 h-6" />} tone="clinical" />
        <StatCard label="In corso" value={stats.inProgress} icon={<Calendar className="w-6 h-6" />} tone="warning" />
        <StatCard label="Completate" value={stats.completed} icon={<ClipboardCheck className="w-6 h-6" />} tone="success" />
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-2 p-4">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setFilterStatus(filter.value)}
              className={`rounded-lg px-4 py-2 font-medium transition ${
                filterStatus === filter.value
                  ? 'bg-amber-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
          </CardContent>
        </Card>
      ) : filteredActions.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="w-6 h-6" />}
          title={actions.length === 0 ? 'Nessuna azione RCA presente' : 'Nessuna azione trovata'}
          description={actions.length === 0
            ? 'Le azioni create dalle cause candidate appariranno qui.'
            : 'Modifica il filtro selezionato per visualizzare altre azioni.'}
        />
      ) : (
        <div className="space-y-4">
          {filteredActions.map((action) => (
            <Card key={action.id}>
              <CardContent className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{action.description}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRCAActionStatusColor(action.status)}`}>
                      {getRCAActionStatusLabel(action.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRCAPriorityColor(action.priority)}`}>
                      Priorita: {getRCAPriorityLabel(action.priority)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRCASeverityColor(action.assessment?.severity)}`}>
                      Severita evento: {action.assessment?.severity || 'N/D'}
                    </span>
                    {action.cause?.is_root_cause && renderRootCauseStatusBadge(action.cause)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-slate-500">Assessment / Evento</p>
                        <p className="font-medium text-slate-900">{action.assessment?.title || 'N/D'}</p>
                        <p className="text-slate-600">{action.assessment?.event_title || 'N/D'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ClipboardCheck className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-slate-500">Causa collegata</p>
                        <p className="font-medium text-slate-900">{action.cause?.description || 'Non collegata'}</p>
                        <p className="text-slate-600">{action.cause?.category || 'Categoria N/D'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-slate-500">Responsabile</p>
                        <p className="font-medium text-slate-900">{action.responsible || 'Non assegnato'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-slate-500">Scadenza</p>
                        <p className="font-medium text-slate-900">{formatDate(action.due_date)}</p>
                      </div>
                    </div>
                  </div>

                  {editingActionId === action.id && (
                    <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Descrizione azione *
                          </label>
                          <textarea
                            value={editDescription}
                            onChange={(event) => setEditDescription(event.target.value)}
                            rows={3}
                            className="clinical-input px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Responsabile</label>
                          <input
                            type="text"
                            value={editResponsible}
                            onChange={(event) => setEditResponsible(event.target.value)}
                            className="clinical-input px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Scadenza</label>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(event) => setEditDueDate(event.target.value)}
                            className="clinical-input px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Priorita</label>
                          <select
                            value={editPriority}
                            onChange={(event) => setEditPriority(event.target.value as '' | RCAPriority)}
                            className="clinical-input px-3 py-2 text-sm"
                          >
                            {priorityOptions.map((option) => (
                              <option key={option.value || 'none'} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Stato</label>
                          <select
                            value={editStatus}
                            onChange={(event) => setEditStatus(event.target.value as EditableRCAActionStatus)}
                            className="clinical-input px-3 py-2 text-sm"
                          >
                            {actionStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => saveEditedAction(action)}
                          disabled={savingEditActionId === action.id}
                          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
                        >
                          {savingEditActionId === action.id ? 'Salvataggio...' : 'Salva'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditAction}
                          disabled={savingEditActionId === action.id}
                          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start lg:items-end gap-2">
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                    Stato azione
                    <select
                      value={normalizeRCAActionStatus(action.status)}
                      disabled={updatingActionId === action.id}
                      onChange={(event) => updateActionStatus(action, event.target.value as EditableRCAActionStatus)}
                      className="clinical-input min-w-[170px] px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      {actionStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {updatingActionId === action.id && (
                    <p className="text-xs text-slate-400">Aggiornamento...</p>
                  )}
                  <button
                    type="button"
                    onClick={() => startEditAction(action)}
                    aria-label="Modifica azione RCA"
                    title="Modifica azione"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-orange-100 text-orange-500 hover:bg-orange-50 hover:text-orange-700 transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAction(action.id)}
                    aria-label="Elimina azione RCA"
                    title="Elimina azione"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
