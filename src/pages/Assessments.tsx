import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { RiskAssessment } from '../types'
import { Plus, FileText, Clock, CheckCircle, AlertTriangle, Trash2, Search } from 'lucide-react'

export default function Assessments() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    const { data, error } = await supabase
      .from('risk_assessments')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setAssessments(data || [])
    }
    setLoading(false)
  }

  const deleteAssessment = async (id: string, title: string) => {
    if (!confirm(`Sei sicuro di voler eliminare "${title}"? Questa azione è irreversibile.`)) return

    const { error } = await supabase
      .from('risk_assessments')
      .delete()
      .eq('id', id)

    if (!error) {
      setAssessments(assessments.filter(a => a.id !== id))
    }
  }

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = !searchTerm || 
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completato'
      case 'in_progress': return 'In Corso'
      default: return 'Bozza'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'in_progress': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const stats = {
    total: assessments.length,
    draft: assessments.filter(a => a.status === 'draft').length,
    inProgress: assessments.filter(a => a.status === 'in_progress').length,
    completed: assessments.filter(a => a.status === 'completed').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Risk Assessment</h1>
          <p className="text-gray-500 mt-1">Gestisci tutti i tuoi assessment FMEA/HFMEA</p>
        </div>
        <Link
          to="/assessment/new"
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-lg font-medium transition"
        >
          <Plus className="w-5 h-5" />
          Nuovo Assessment
        </Link>
      </div>

      {/* Stats */}
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
          <p className="text-gray-500 text-sm">In Corso</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Completati</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca assessment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'draft', 'in_progress', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === status
                    ? 'bg-sky-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Tutti' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assessment List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento...
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {assessments.length === 0 
              ? "Non hai ancora creato nessun assessment" 
              : "Nessun assessment trovato con i filtri selezionati"}
          </p>
          {assessments.length === 0 && (
            <Link
              to="/assessment/new"
              className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Crea il tuo primo assessment
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAssessments.map(assessment => (
            <div
              key={assessment.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                {getStatusIcon(assessment.status)}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/assessment/${assessment.id}`}
                    className="font-semibold text-gray-800 hover:text-sky-600 transition"
                  >
                    {assessment.title}
                  </Link>
                  {assessment.description && (
                    <p className="text-sm text-gray-500 truncate">{assessment.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Creato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment.status)}`}>
                    {getStatusLabel(assessment.status)}
                  </span>
                  <Link
                    to={`/assessment/${assessment.id}`}
                    className="px-4 py-2 bg-sky-50 text-sky-600 rounded-lg font-medium hover:bg-sky-100 transition"
                  >
                    Apri
                  </Link>
                  <button
                    onClick={() => deleteAssessment(assessment.id, assessment.title)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
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