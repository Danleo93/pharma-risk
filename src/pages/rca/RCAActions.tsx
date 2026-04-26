import { useEffect, useState } from 'react'
import { AlertCircle, Calendar, ClipboardCheck, FileText, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

type RCAActionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'
type RCAPriority = 'low' | 'medium' | 'high' | 'critical'

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
  } | null
  assessment?: {
    title: string
    event_title: string
    severity: string | null
    status: string
  } | null
}

const statusFilters: { value: 'all' | RCAActionStatus; label: string }[] = [
  { value: 'all', label: 'Tutte' },
  { value: 'planned', label: 'Pianificate' },
  { value: 'in_progress', label: 'In corso' },
  { value: 'completed', label: 'Completate' },
  { value: 'cancelled', label: 'Annullate' },
]

export default function RCAActions() {
  const { user } = useAuth()
  const [actions, setActions] = useState<RCAActionWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | RCAActionStatus>('all')

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
        cause:rca_causes(description, category, is_root_cause),
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

  const filteredActions = actions.filter((action) => {
    return filterStatus === 'all' || action.status === filterStatus
  })

  const stats = {
    total: actions.length,
    planned: actions.filter((action) => action.status === 'planned').length,
    inProgress: actions.filter((action) => action.status === 'in_progress').length,
    completed: actions.filter((action) => action.status === 'completed').length,
  }

  const getStatusLabel = (status: RCAActionStatus) => {
    switch (status) {
      case 'completed':
        return 'Completata'
      case 'in_progress':
        return 'In corso'
      case 'cancelled':
        return 'Annullata'
      default:
        return 'Pianificata'
    }
  }

  const getStatusColor = (status: RCAActionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-blue-100 text-blue-700'
    }
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
                <div className="min-w-0">
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
                    {action.cause?.is_root_cause && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-200">
                        Candidata Root Cause
                      </span>
                    )}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
