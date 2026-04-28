import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { RiskAssessment } from '../types'
import { Plus, FileText, Clock, CheckCircle, AlertTriangle, Trash2, Search } from 'lucide-react'
import { getFMEAAssessmentStatusColor, getFMEAAssessmentStatusLabel } from '../lib/labels'
import { Card, CardContent } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'

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

  const stats = {
    total: assessments.length,
    draft: assessments.filter(a => a.status === 'draft').length,
    inProgress: assessments.filter(a => a.status === 'in_progress').length,
    completed: assessments.filter(a => a.status === 'completed').length,
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title="Risk Assessment"
        description="Gestisci tutti i tuoi assessment FMEA/HFMEA."
        eyebrow="Analisi Proattiva"
        actions={(
          <Link
            to="/fmea/assessment/new"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-5 py-3 font-medium text-white transition hover:bg-sky-800"
          >
            <Plus className="w-5 h-5" />
            Nuovo Assessment
          </Link>
        )}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Totale" value={stats.total} icon={<FileText className="w-6 h-6" />} tone="fmea" />
        <StatCard label="Bozze" value={stats.draft} icon={<FileText className="w-6 h-6" />} tone="neutral" />
        <StatCard label="In corso" value={stats.inProgress} icon={<Clock className="w-6 h-6" />} tone="warning" />
        <StatCard label="Completati" value={stats.completed} icon={<CheckCircle className="w-6 h-6" />} tone="success" />
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cerca assessment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="clinical-input py-2 pl-10 pr-4"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'draft', 'in_progress', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-lg px-4 py-2 font-medium transition ${
                    filterStatus === status
                      ? 'bg-sky-700 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-800'
                  }`}
                >
                  {status === 'all' ? 'Tutti' : getFMEAAssessmentStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment List */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento...
          </CardContent>
        </Card>
      ) : filteredAssessments.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-6 h-6" />}
          title={assessments.length === 0 ? 'Non hai ancora creato nessun assessment' : 'Nessun assessment trovato'}
          description={assessments.length === 0 ? undefined : 'Modifica ricerca o filtri per visualizzare altri assessment.'}
          action={assessments.length === 0 && (
          <Link
            to="/fmea/assessment/new"
            className="inline-flex items-center gap-2 font-medium text-sky-700 hover:text-sky-800"
          >
            <Plus className="w-4 h-4" />
            Crea il tuo primo assessment
          </Link>
          )}
        />
      ) : (
        <div className="grid gap-4">
          {filteredAssessments.map(assessment => (
            <Card key={assessment.id} className="transition hover:shadow-clinical">
              <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {getStatusIcon(assessment.status)}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/fmea/assessment/${assessment.id}`}
                    className="font-semibold text-slate-900 transition hover:text-sky-700"
                  >
                    {assessment.title}
                  </Link>
                  {assessment.description && (
                    <p className="truncate text-sm text-slate-500">{assessment.description}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Creato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFMEAAssessmentStatusColor(assessment.status)}`}>
                    {getFMEAAssessmentStatusLabel(assessment.status)}
                  </span>
                  <Link
                    to={`/fmea/assessment/${assessment.id}`}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
