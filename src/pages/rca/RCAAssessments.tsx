import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle, Clock, FileText, Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { RCAAssessment, RCAAssessmentStatus } from '../../types'
import {
  getRCAAssessmentStatusColor,
  getRCAAssessmentStatusLabel,
  getRCASeverityColor,
  getRCASeverityLabel,
} from '../../lib/labels'
import { Card, CardContent } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'

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
      case 'action_planned':
        return <Clock className="w-5 h-5 text-sky-500" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title="Assessment RCA"
        description="Gestisci gli assessment di Analisi Reattiva."
        eyebrow="Analisi Reattiva"
        actions={(
          <Link
            to="/rca/assessment/new"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-3 font-medium text-white transition hover:bg-amber-700"
          >
            <Plus className="w-5 h-5" />
            Nuovo Assessment
          </Link>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Totale" value={stats.total} icon={<FileText className="w-6 h-6" />} tone="rca" />
        <StatCard label="Bozze" value={stats.draft} icon={<FileText className="w-6 h-6" />} tone="neutral" />
        <StatCard label="In corso" value={stats.inProgress} icon={<Clock className="w-6 h-6" />} tone="warning" />
        <StatCard label="Completati" value={stats.completed} icon={<CheckCircle className="w-6 h-6" />} tone="success" />
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cerca per titolo o descrizione evento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="clinical-input py-2 pl-10 pr-4"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="clinical-input px-4 py-2 lg:w-56"
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
              className="clinical-input px-4 py-2 lg:w-52"
            >
              <option value="all">Tutte le severita'</option>
              <option value="low">Bassa</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Critica</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento...
          </CardContent>
        </Card>
      ) : filteredAssessments.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="w-6 h-6" />}
          title={assessments.length === 0 ? 'Nessun assessment RCA disponibile' : 'Nessun assessment trovato'}
          description={assessments.length === 0
            ? 'Crea il primo assessment per registrare un evento, incidente o near miss.'
            : 'Modifica i filtri o il testo di ricerca.'}
          action={assessments.length === 0 && (
            <Link
              to="/rca/assessment/new"
              className="inline-flex items-center gap-2 font-medium text-amber-700 hover:text-amber-800"
            >
              <Plus className="w-4 h-4" />
              Crea assessment RCA
            </Link>
          )}
        />
      ) : (
        <div className="grid gap-4">
          {filteredAssessments.map((assessment) => (
            <Card key={assessment.id} className="transition hover:shadow-clinical">
              <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">{getStatusIcon(assessment.status)}</div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/rca/assessment/${assessment.id}`}
                    className="font-semibold text-slate-900 transition hover:text-amber-700"
                  >
                    {assessment.title}
                  </Link>
                  <p className="mt-1 truncate text-sm text-slate-600">{assessment.event_title}</p>
                  {assessment.event_description && (
                    <p className="mt-1 truncate text-sm text-slate-500">{assessment.event_description}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    Creato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                    {assessment.event_date && ` - Evento: ${new Date(assessment.event_date).toLocaleDateString('it-IT')}`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRCAAssessmentStatusColor(assessment.status)}`}>
                    {getRCAAssessmentStatusLabel(assessment.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRCASeverityColor(assessment.severity)}`}>
                    {assessment.severity ? getRCASeverityLabel(assessment.severity) : 'N/D'}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
