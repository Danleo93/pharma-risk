import { useEffect, useState } from 'react'
import { AlertCircle, Calendar, ClipboardCheck, FileText, Pencil, Trash2, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

type RCAActionStatus = string
type EditableRCAActionStatus = 'planned' | 'in_progress' | 'completed'
type RCAPriority = 'low' | 'medium' | 'high' | 'critical'
type RootCauseStatus = 'candidate' | 'confirmed' | 'not_confirmed'

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

const statusFilters: { value: 'all' | EditableRCAActionStatus; label: string }[] = [
  { value: 'all', label: 'Tutte' },
  { value: 'planned', label: 'Pianificate' },
  { value: 'in_progress', label: 'In corso' },
  { value: 'completed', label: 'Completate' },
]

const actionStatusOptions: { value: EditableRCAActionStatus; label: string }[] = [
  { value: 'planned', label: 'Pianificata' },
  { value: 'in_progress', label: 'In corso' },
  { value: 'completed', label: 'Completata' },
]

const priorityOptions: { value: '' | RCAPriority; label: string }[] = [
  { value: '', label: 'N/D' },
  { value: 'low', label: 'Bassa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Critica' },
]

const normalizeActionStatus = (status: RCAActionStatus): EditableRCAActionStatus => {
  if (status === 'completed') return 'completed'
  if (status === 'in_progress') return 'in_progress'
  return 'planned'
}

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
    if (!user || normalizeActionStatus(action.status) === nextStatus) return

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
    setEditStatus(normalizeActionStatus(action.status))
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
    return filterStatus === 'all' || normalizeActionStatus(action.status) === filterStatus
  })

  const stats = {
    total: actions.length,
    planned: actions.filter((action) => normalizeActionStatus(action.status) === 'planned').length,
    inProgress: actions.filter((action) => action.status === 'in_progress').length,
    completed: actions.filter((action) => action.status === 'completed').length,
  }

  const getStatusLabel = (status: RCAActionStatus) => {
    switch (normalizeActionStatus(status)) {
      case 'completed':
        return 'Completata'
      case 'in_progress':
        return 'In corso'
      default:
        return 'Pianificata'
    }
  }

  const getStatusColor = (status: RCAActionStatus) => {
    switch (normalizeActionStatus(status)) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  const getEffectiveRootCauseStatus = (
    cause: Pick<NonNullable<RCAActionWithRelations['cause']>, 'is_root_cause' | 'root_cause_status'> | null | undefined,
  ) => {
    if (!cause?.is_root_cause) return null
    if (cause.root_cause_status === 'confirmed') return 'confirmed'
    if (cause.root_cause_status === 'not_confirmed') return 'not_confirmed'
    return 'candidate'
  }

  const getRootCauseStatusLabel = (
    cause: Pick<NonNullable<RCAActionWithRelations['cause']>, 'is_root_cause' | 'root_cause_status'> | null | undefined,
  ) => {
    const status = getEffectiveRootCauseStatus(cause)
    if (status === 'confirmed') return 'Root Cause confermata'
    if (status === 'not_confirmed') return 'Non confermata'
    if (status === 'candidate') return 'Candidata Root Cause'
    return null
  }

  const getRootCauseStatusColor = (
    cause: Pick<NonNullable<RCAActionWithRelations['cause']>, 'is_root_cause' | 'root_cause_status'> | null | undefined,
  ) => {
    const status = getEffectiveRootCauseStatus(cause)
    if (status === 'confirmed') return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    if (status === 'not_confirmed') return 'bg-slate-100 text-slate-600 border border-slate-200'
    if (status === 'candidate') return 'bg-red-100 text-red-700 border border-red-200'
    return ''
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

  const getPriorityLabel = (priority: RCAPriority | null) => {
    switch (priority) {
      case 'critical':
        return 'Critica'
      case 'high':
        return 'Alta'
      case 'medium':
        return 'Media'
      case 'low':
        return 'Bassa'
      default:
        return 'N/D'
    }
  }

  const getPriorityColor = (priority: RCAPriority | null) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getSeverityColor = (severity: string | null | undefined) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatDate = (date: string | null) => {
    return date ? new Date(date).toLocaleDateString('it-IT') : 'N/D'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Azioni Correttive RCA</h1>
          <p className="text-gray-500 mt-1">
            Monitora le azioni create dalle cause candidate negli assessment RCA.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Crea azioni dal dettaglio assessment RCA"
          className="flex items-center gap-2 bg-gray-200 text-gray-500 px-5 py-3 rounded-lg font-medium cursor-not-allowed"
        >
          Nuova Azione
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Totale</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Pianificate</p>
          <p className="text-2xl font-bold text-blue-600">{stats.planned}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">In corso</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Completate</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setFilterStatus(filter.value)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === filter.value
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-700 border border-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento...
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">
            {actions.length === 0 ? 'Nessuna azione RCA presente' : 'Nessuna azione trovata'}
          </h2>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            {actions.length === 0
              ? 'Le azioni create dalle cause candidate appariranno qui.'
              : 'Modifica il filtro selezionato per visualizzare altre azioni.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActions.map((action) => (
            <div key={action.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800">{action.description}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(action.status)}`}>
                      {getStatusLabel(action.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(action.priority)}`}>
                      Priorita: {getPriorityLabel(action.priority)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(action.assessment?.severity)}`}>
                      Severita evento: {action.assessment?.severity || 'N/D'}
                    </span>
                    {action.cause?.is_root_cause && renderRootCauseStatusBadge(action.cause)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-500">Assessment / Evento</p>
                        <p className="font-medium text-gray-800">{action.assessment?.title || 'N/D'}</p>
                        <p className="text-gray-600">{action.assessment?.event_title || 'N/D'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ClipboardCheck className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-500">Causa collegata</p>
                        <p className="font-medium text-gray-800">{action.cause?.description || 'Non collegata'}</p>
                        <p className="text-gray-600">{action.cause?.category || 'Categoria N/D'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-500">Responsabile</p>
                        <p className="font-medium text-gray-800">{action.responsible || 'Non assegnato'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-500">Scadenza</p>
                        <p className="font-medium text-gray-800">{formatDate(action.due_date)}</p>
                      </div>
                    </div>
                  </div>

                  {editingActionId === action.id && (
                    <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50/40 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrizione azione *
                          </label>
                          <textarea
                            value={editDescription}
                            onChange={(event) => setEditDescription(event.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Responsabile</label>
                          <input
                            type="text"
                            value={editResponsible}
                            onChange={(event) => setEditResponsible(event.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Scadenza</label>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(event) => setEditDueDate(event.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Priorita</label>
                          <select
                            value={editPriority}
                            onChange={(event) => setEditPriority(event.target.value as '' | RCAPriority)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          >
                            {priorityOptions.map((option) => (
                              <option key={option.value || 'none'} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
                          <select
                            value={editStatus}
                            onChange={(event) => setEditStatus(event.target.value as EditableRCAActionStatus)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
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
                          className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition disabled:opacity-60"
                        >
                          {savingEditActionId === action.id ? 'Salvataggio...' : 'Salva'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditAction}
                          disabled={savingEditActionId === action.id}
                          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-white transition disabled:opacity-60"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start lg:items-end gap-2">
                  <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                    Stato azione
                    <select
                      value={normalizeActionStatus(action.status)}
                      disabled={updatingActionId === action.id}
                      onChange={(event) => updateActionStatus(action, event.target.value as EditableRCAActionStatus)}
                      className="min-w-[170px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      {actionStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {updatingActionId === action.id && (
                    <p className="text-xs text-gray-400">Aggiornamento...</p>
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
