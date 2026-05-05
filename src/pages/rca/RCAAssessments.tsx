import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Archive, CheckCircle, Clock, FileText, Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { RCAAssessment, RCAAssessmentStatus } from '../../types'
import {
  RCA_ASSESSMENT_STATUS_OPTIONS,
  getRCAAssessmentStatusColor,
  getRCASeverityColor,
  getRCASeverityLabel,
} from '../../lib/labels'
import { Card, CardContent } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'

type AssessmentView = 'active' | 'archived'

const getSelectableStatus = (status: RCAAssessmentStatus): Exclude<RCAAssessmentStatus, 'action_planned'> => {
  return status === 'action_planned' ? 'in_progress' : status
}

export default function RCAAssessments() {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState<RCAAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [assessmentView, setAssessmentView] = useState<AssessmentView>('active')
  const [updatingAssessmentId, setUpdatingAssessmentId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchAssessments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchAssessments = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('rca_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Errore caricamento assessment RCA:', fetchError)
      setError('Impossibile caricare gli assessment RCA.')
    } else {
      setAssessments(data || [])
    }
    setLoading(false)
  }

  const deleteAssessment = async (id: string, title: string) => {
    if (!user) return
    if (!confirm(`Sei sicuro di voler eliminare "${title}"? Questa azione e irreversibile.`)) return

    const { error: deleteError } = await supabase
      .from('rca_assessments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Errore eliminazione assessment RCA:', deleteError)
      setError('Impossibile eliminare l assessment RCA.')
      return
    }

    setAssessments((current) => current.filter((assessment) => assessment.id !== id))
  }

  const updateAssessmentStatus = async (assessment: RCAAssessment, nextStatus: RCAAssessmentStatus) => {
    if (!user || nextStatus === assessment.status) return

    if (nextStatus === 'archived') {
      const confirmed = confirm("Archiviare questo assessment? Sarà spostato nell'Archivio assessment.")
      if (!confirmed) return
    }

    const nextClosedAt = nextStatus === 'completed'
      ? assessment.closed_at || new Date().toISOString()
      : assessment.closed_at

    setUpdatingAssessmentId(assessment.id)
    setError(null)

    const { data, error: updateError } = await supabase
      .from('rca_assessments')
      .update({
        status: nextStatus,
        closed_at: nextClosedAt,
      })
      .eq('id', assessment.id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Errore aggiornamento stato RCA:', updateError)
      setError('Impossibile aggiornare lo stato dell assessment RCA.')
    } else if (data) {
      setAssessments((current) => current.map((item) => (
        item.id === assessment.id ? data as RCAAssessment : item
      )))
    }

    setUpdatingAssessmentId(null)
  }

  const activeAssessments = assessments.filter((assessment) => assessment.status !== 'archived')
  const archivedAssessments = assessments.filter((assessment) => assessment.status === 'archived')
  const baseAssessments = assessmentView === 'active' ? activeAssessments : archivedAssessments

  const filteredAssessments = baseAssessments.filter((assessment) => {
    const matchesSearch =
      !searchTerm ||
      assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.event_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.event_description?.toLowerCase().includes(searchTerm.toLowerCase())
    const normalizedStatus = getSelectableStatus(assessment.status)
    const matchesStatus = filterStatus === 'all' || normalizedStatus === filterStatus
    const matchesSeverity = filterSeverity === 'all' || assessment.severity === filterSeverity
    return matchesSearch && matchesStatus && matchesSeverity
  })

  const stats = {
    total: activeAssessments.length,
    draft: activeAssessments.filter((a) => a.status === 'draft').length,
    inProgress: activeAssessments.filter((a) => a.status === 'in_progress' || a.status === 'action_planned').length,
    completed: activeAssessments.filter((a) => a.status === 'completed').length,
  }

  const getStatusIcon = (status: RCAAssessmentStatus) => {
    switch (getSelectableStatus(status)) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'archived':
        return <Archive className="h-5 w-5 text-slate-400" />
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title="Assessment RCA"
        description="Worklist degli assessment di Analisi Reattiva e archivio separato per le valutazioni non operative."
        eyebrow="Analisi Reattiva"
        actions={(
          <Link
            to="/rca/assessment/new"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-3 font-medium text-white transition hover:bg-amber-700"
          >
            <Plus className="h-5 w-5" />
            Nuovo Assessment
          </Link>
        )}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attivi" value={stats.total} icon={<FileText className="h-6 w-6" />} tone="rca" />
        <StatCard label="Bozze" value={stats.draft} icon={<FileText className="h-6 w-6" />} tone="neutral" />
        <StatCard label="In corso" value={stats.inProgress} icon={<Clock className="h-6 w-6" />} tone="warning" />
        <StatCard label="Completati" value={stats.completed} icon={<CheckCircle className="h-6 w-6" />} tone="success" />
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setAssessmentView('active')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                assessmentView === 'active'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Assessment
              <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                {activeAssessments.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAssessmentView('archived')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                assessmentView === 'archived'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <Archive className="h-4 w-4" />
                Archivio assessment
              </span>
              <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                {archivedAssessments.length}
              </span>
            </button>
          </div>
          <p className="text-sm text-slate-500">
            {assessmentView === 'active'
              ? 'Gli archiviati sono rimossi dalla worklist principale.'
              : 'Puoi consultarli e riportarli in lavorazione cambiando stato.'}
          </p>
        </CardContent>
      </Card>

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
              {RCA_ASSESSMENT_STATUS_OPTIONS.filter((option) => option.value !== 'archived').map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="clinical-input px-4 py-2 lg:w-52"
            >
              <option value="all">Tutte le severita</option>
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
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
            Caricamento...
          </CardContent>
        </Card>
      ) : assessments.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Nessun assessment RCA disponibile"
          description="Crea il primo assessment per registrare un evento, incidente o near miss."
          action={(
            <Link
              to="/rca/assessment/new"
              className="inline-flex items-center gap-2 font-medium text-amber-700 hover:text-amber-800"
            >
              <Plus className="h-4 w-4" />
              Crea assessment RCA
            </Link>
          )}
        />
      ) : filteredAssessments.length === 0 ? (
        <EmptyState
          icon={assessmentView === 'active' ? <AlertCircle className="h-6 w-6" /> : <Archive className="h-6 w-6" />}
          title={assessmentView === 'active' ? 'Nessun assessment trovato' : 'Nessun assessment archiviato'}
          description={assessmentView === 'active'
            ? 'Modifica i filtri o il testo di ricerca.'
            : 'Quando archivi un assessment RCA, viene mostrato qui.'}
        />
      ) : (
        <div className="grid gap-4">
          {filteredAssessments.map((assessment) => (
            <Card key={assessment.id} className="transition hover:shadow-clinical">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="mt-1">{getStatusIcon(assessment.status)}</div>
                    <div className="min-w-0">
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
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stato</span>
                      <select
                        value={getSelectableStatus(assessment.status)}
                        disabled={updatingAssessmentId === assessment.id}
                        onChange={(event) => updateAssessmentStatus(assessment, event.target.value as RCAAssessmentStatus)}
                        className={`rounded-full border-0 px-3 py-1 text-sm font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60 ${getRCAAssessmentStatusColor(assessment.status)}`}
                      >
                        {RCA_ASSESSMENT_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${getRCASeverityColor(assessment.severity)}`}>
                      {assessment.severity ? getRCASeverityLabel(assessment.severity) : 'N/D'}
                    </span>
                    <Link
                      to={`/rca/assessment/${assessment.id}`}
                      className="rounded-lg bg-orange-50 px-4 py-2 font-medium text-orange-600 transition hover:bg-orange-100"
                    >
                      Apri
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteAssessment(assessment.id, assessment.title)}
                      className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                      title="Elimina assessment"
                    >
                      <Trash2 className="h-5 w-5" />
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
