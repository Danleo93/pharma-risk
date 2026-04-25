import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle, Clock, FileText, Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { RCAAssessment, RCAAssessmentStatus, RCASeverity } from '../../types'

const statusLabels: Record<RCAAssessmentStatus, string> = {
  draft: 'Bozza',
  in_progress: 'In corso',
  action_planned: 'Azioni pianificate',
  completed: 'Completato',
  archived: 'Archiviato',
}

const severityLabels: Record<RCASeverity, string> = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
  critical: 'Critica',
}

export default function RCAAssessments() {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState<RCAAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')

  useEffect(() => {
    if (!user) return
    fetchAssessments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchAssessments = async () => {
    if (!user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('rca_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error) {
      setAssessments(data || [])
    }
    setLoading(false)
  }

  const deleteAssessment = async (id: string, title: string) => {
    if (!user) return
    if (!confirm(`Sei sicuro di voler eliminare "${title}"? Questa azione e' irreversibile.`)) return

    const { error } = await supabase
      .from('rca_assessments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      setAssessments(assessments.filter((assessment) => assessment.id !== id))
    }
  }

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch =
      !searchTerm ||
      assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.event_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.event_description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || assessment.status === filterStatus
    const matchesSeverity = filterSeverity === 'all' || assessment.severity === filterSeverity
    return matchesSearch && matchesStatus && matchesSeverity
  })

  const stats = {
    total: assessments.length,
    draft: assessments.filter((a) => a.status === 'draft').length,
    inProgress: assessments.filter((a) => a.status === 'in_progress').length,
    completed: assessments.filter((a) => a.status === 'completed').length,
  }

  const getStatusIcon = (status: RCAAssessmentStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in_progress':
      case 'action_planned':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: RCAAssessmentStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
      case 'action_planned':
        return 'bg-yellow-100 text-yellow-700'
      case 'archived':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-orange-100 text-orange-700'
    }
  }

  const getSeverityColor = (severity: RCASeverity | null) => {
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Assessment RCA</h1>
          <p className="text-gray-500 mt-1">Gestisci gli assessment di Analisi Reattiva</p>
        </div>
        <Link
          to="/rca/assessment/new"
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-lg font-medium transition"
        >
          <Plus className="w-5 h-5" />
          Nuovo Assessment
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Totale</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Bozze</p>
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">In corso</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Completati</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca per titolo o descrizione evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          >
            <option value="all">Tutti gli stati</option>
            <option value="draft">Bozza</option>
            <option value="in_progress">In corso</option>
            <option value="action_planned">Azioni pianificate</option>
            <option value="completed">Completato</option>
            <option value="archived">Archiviato</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          >
            <option value="all">Tutte le severita'</option>
            <option value="low">Bassa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="critical">Critica</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento...
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">
            {assessments.length === 0 ? 'Nessun assessment RCA disponibile' : 'Nessun assessment trovato'}
          </h2>
          <p className="text-gray-500 mt-2 mb-6">
            {assessments.length === 0
              ? 'Crea il primo assessment per registrare un evento, incidente o near miss.'
              : 'Modifica i filtri o il testo di ricerca.'}
          </p>
          {assessments.length === 0 && (
            <Link
              to="/rca/assessment/new"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Crea assessment RCA
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAssessments.map((assessment) => (
            <div
              key={assessment.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">{getStatusIcon(assessment.status)}</div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/rca/assessment/${assessment.id}`}
                    className="font-semibold text-gray-800 hover:text-orange-600 transition"
                  >
                    {assessment.title}
                  </Link>
                  <p className="text-sm text-gray-600 mt-1 truncate">{assessment.event_title}</p>
                  {assessment.event_description && (
                    <p className="text-sm text-gray-500 mt-1 truncate">{assessment.event_description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Creato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                    {assessment.event_date && ` - Evento: ${new Date(assessment.event_date).toLocaleDateString('it-IT')}`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment.status)}`}>
                    {statusLabels[assessment.status]}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(assessment.severity)}`}>
                    {assessment.severity ? severityLabels[assessment.severity] : 'N/D'}
                  </span>
                  <Link
                    to={`/rca/assessment/${assessment.id}`}
                    className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg font-medium hover:bg-orange-100 transition"
                  >
                    Apri
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteAssessment(assessment.id, assessment.title)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Elimina assessment"
                  >
                    <Trash2 className="w-5 h-5" />
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
