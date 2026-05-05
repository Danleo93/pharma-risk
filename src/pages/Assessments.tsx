import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { RiskAssessment } from '../types'
import { Plus, FileText, Clock, CheckCircle, AlertTriangle, Trash2, Search, Archive } from 'lucide-react'
import {
  FMEA_ASSESSMENT_STATUS_OPTIONS,
  getFMEAAssessmentStatusColor,
  type FMEAStatus,
} from '../lib/labels'
import { Card, CardContent } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'

type AssessmentView = 'active' | 'archived'

export default function Assessments() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [assessmentView, setAssessmentView] = useState<AssessmentView>('active')
  const [updatingAssessmentId, setUpdatingAssessmentId] = useState<string | null>(null)

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('risk_assessments')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Errore caricamento assessment FMEA:', fetchError)
      setError('Impossibile caricare gli assessment FMEA.')
    } else {
      setAssessments(data || [])
    }
    setLoading(false)
  }

  const updateAssessmentStatus = async (assessment: RiskAssessment, status: FMEAStatus) => {
    if (status === assessment.status) return

    if (status === 'archived') {
      const confirmed = confirm("Archiviare questo assessment? Sarà spostato nell'Archivio assessment.")
      if (!confirmed) return
    }

    setUpdatingAssessmentId(assessment.id)
    setError(null)

    const { data, error: updateError } = await supabase
      .from('risk_assessments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', assessment.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Errore aggiornamento stato assessment FMEA:', updateError)
      setError("Impossibile aggiornare lo stato dell'assessment FMEA. Verifica che il database supporti lo stato Archiviato.")
    } else if (data) {
      setAssessments((current) => current.map((item) => (
        item.id === assessment.id ? data as RiskAssessment : item
      )))
    }

    setUpdatingAssessmentId(null)
  }

  const deleteAssessment = async (id: string, title: string) => {
    if (!confirm(`Sei sicuro di voler eliminare "${title}"? Questa azione e irreversibile.`)) return

    const { error: deleteError } = await supabase
      .from('risk_assessments')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Errore eliminazione assessment FMEA:', deleteError)
      setError("Impossibile eliminare l'assessment FMEA.")
      return
    }

    setAssessments((current) => current.filter((assessment) => assessment.id !== id))
  }

  const activeAssessments = assessments.filter((assessment) => assessment.status !== 'archived')
  const archivedAssessments = assessments.filter((assessment) => assessment.status === 'archived')
  const baseAssessments = assessmentView === 'active' ? activeAssessments : archivedAssessments

  const filteredAssessments = baseAssessments.filter((assessment) => {
    const matchesSearch =
      !searchTerm ||
      assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || assessment.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const stats = {
    total: activeAssessments.length,
    draft: activeAssessments.filter((assessment) => assessment.status === 'draft').length,
    inProgress: activeAssessments.filter((assessment) => assessment.status === 'in_progress').length,
    completed: activeAssessments.filter((assessment) => assessment.status === 'completed').length,
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title="Risk Assessment"
        description="Worklist degli assessment FMEA/HFMEA e archivio separato per le valutazioni non operative."
        eyebrow="Analisi Proattiva"
        actions={(
          <Link
            to="/fmea/assessment/new"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-5 py-3 font-medium text-white transition hover:bg-sky-800"
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
        <StatCard label="Attivi" value={stats.total} icon={<FileText className="h-6 w-6" />} tone="fmea" />
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
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:text-sky-700'
              }`}
            >
              Assessment
              <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
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
              {FMEA_ASSESSMENT_STATUS_OPTIONS.filter((option) => option.value !== 'archived').map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus((current) => current === option.value ? 'all' : option.value)}
                  className={`rounded-lg px-4 py-2 font-medium transition ${
                    filterStatus === option.value
                      ? 'bg-sky-700 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`rounded-lg px-4 py-2 font-medium transition ${
                  filterStatus === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                Tutti
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
            Caricamento...
          </CardContent>
        </Card>
      ) : assessments.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Non hai ancora creato nessun assessment"
          action={(
            <Link
              to="/fmea/assessment/new"
              className="inline-flex items-center gap-2 font-medium text-sky-700 hover:text-sky-800"
            >
              <Plus className="h-4 w-4" />
              Crea il tuo primo assessment
            </Link>
          )}
        />
      ) : filteredAssessments.length === 0 ? (
        <EmptyState
          icon={assessmentView === 'active' ? <AlertTriangle className="h-6 w-6" /> : <Archive className="h-6 w-6" />}
          title={assessmentView === 'active' ? 'Nessun assessment trovato' : 'Nessun assessment archiviato'}
          description={assessmentView === 'active'
            ? 'Modifica ricerca o filtri per visualizzare altri assessment.'
            : 'Quando archivi una valutazione, questa verra mostrata qui.'}
        />
      ) : (
        <div className="grid gap-4">
          {filteredAssessments.map((assessment) => (
            <Card key={assessment.id} className="transition hover:shadow-clinical">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    {getStatusIcon(assessment.status)}
                    <div className="min-w-0">
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
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stato</span>
                      <select
                        value={assessment.status}
                        disabled={updatingAssessmentId === assessment.id}
                        onChange={(event) => updateAssessmentStatus(assessment, event.target.value as FMEAStatus)}
                        className={`rounded-full border-0 px-3 py-1 text-sm font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60 ${getFMEAAssessmentStatusColor(assessment.status)}`}
                      >
                        {FMEA_ASSESSMENT_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Link
                      to={`/fmea/assessment/${assessment.id}`}
                      className="rounded-lg bg-sky-50 px-4 py-2 font-medium text-sky-600 transition hover:bg-sky-100"
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
