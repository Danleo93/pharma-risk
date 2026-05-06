import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Archive, CalendarDays, ClipboardList, FileText, Percent, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { deleteGapAssessment, getGapAssessments, updateGapAssessmentStatus } from '../../services/gapService'
import type { GapAssessment, GapAssessmentStatus } from '../../types/gap'
import {
  GAP_ASSESSMENT_STATUS_OPTIONS,
  getGapAssessmentStatusColor,
} from '../../lib/labels'
import { GapAssessmentCreatePanel } from '../../components/gap/GapAssessmentCreatePanel'
import { Card, CardContent } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'

type AssessmentView = 'active' | 'archived'

const formatDate = (date: string | null) => {
  return date ? new Date(date).toLocaleDateString('it-IT') : 'N/D'
}

const formatCompliance = (value: number | null | undefined) => {
  return `${Math.round(value || 0)}%`
}

export default function GapAssessments() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assessments, setAssessments] = useState<GapAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [assessmentView, setAssessmentView] = useState<AssessmentView>('active')
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(null)
  const [updatingAssessmentId, setUpdatingAssessmentId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const fetchAssessments = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getGapAssessments(user.id)
        setAssessments(data)
      } catch (fetchError) {
        console.error('Errore caricamento assessment Gap Analysis:', fetchError)
        setError('Impossibile caricare gli assessment Gap Analysis.')
      } finally {
        setLoading(false)
      }
    }

    fetchAssessments()
  }, [user?.id])

  const activeAssessments = assessments.filter((assessment) => assessment.status !== 'archived')
  const archivedAssessments = assessments.filter((assessment) => assessment.status === 'archived')
  const visibleAssessments = assessmentView === 'active' ? activeAssessments : archivedAssessments
  const completedAssessments = activeAssessments.filter((assessment) => assessment.status === 'completed').length
  const averageCompliance = activeAssessments.length > 0
    ? activeAssessments.reduce((sum, assessment) => sum + (assessment.compliance_percentage || 0), 0) / activeAssessments.length
    : 0

  const changeAssessmentStatus = async (assessment: GapAssessment, status: GapAssessmentStatus) => {
    if (!user?.id || status === assessment.status) return

    if (status === 'archived') {
      const confirmed = confirm("Archiviare questo assessment? Sarà spostato nell'Archivio assessment.")
      if (!confirmed) return
    }

    setUpdatingAssessmentId(assessment.id)
    setError(null)

    try {
      const updated = await updateGapAssessmentStatus(assessment.id, user.id, status)
      setAssessments((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )))
    } catch (statusError) {
      console.error('Errore aggiornamento stato assessment Gap:', statusError)
      setError("Impossibile aggiornare lo stato dell'assessment Gap.")
    } finally {
      setUpdatingAssessmentId(null)
    }
  }

  const removeAssessment = async (assessment: GapAssessment) => {
    if (!user?.id) return

    const confirmed = confirm(`Eliminare l'assessment Gap "${assessment.title}"? L'operazione non puo essere annullata.`)
    if (!confirmed) return

    setDeletingAssessmentId(assessment.id)
    setError(null)

    try {
      await deleteGapAssessment(assessment.id, user.id)
      setAssessments((current) => current.filter((item) => item.id !== assessment.id))
    } catch (deleteError) {
      console.error('Errore eliminazione assessment Gap:', deleteError)
      setError("Impossibile eliminare l'assessment Gap. Verifica eventuali dati collegati e riprova.")
    } finally {
      setDeletingAssessmentId(null)
    }
  }

  const renderAssessmentCard = (assessment: GapAssessment) => (
    <Card key={assessment.id} className="transition hover:shadow-clinical">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              to={`/gap/assessment/${assessment.id}`}
              className="text-base font-semibold text-slate-900 transition hover:text-teal-700"
            >
              {assessment.title}
            </Link>
            {assessment.description && (
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                {assessment.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>Struttura: {assessment.facility_name || 'N/D'}</span>
              <span>Reparto: {assessment.department || 'N/D'}</span>
              <span>Assessor: {assessment.assessor || 'N/D'}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Data assessment: {formatDate(assessment.assessment_date)}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stato</span>
              <select
                value={assessment.status}
                disabled={updatingAssessmentId === assessment.id}
                onChange={(event) => changeAssessmentStatus(assessment, event.target.value as GapAssessmentStatus)}
                className={`rounded-full border-0 px-3 py-1 text-sm font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60 ${getGapAssessmentStatusColor(assessment.status)}`}
              >
                {GAP_ASSESSMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
              {formatCompliance(assessment.compliance_percentage)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
              {assessment.total_activities} Attivita/Requisiti
            </span>
            <Link
              to={`/gap/assessment/${assessment.id}`}
              className="inline-flex items-center rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
            >
              Apri
            </Link>
            <button
              type="button"
              onClick={() => removeAssessment(assessment)}
              disabled={deletingAssessmentId === assessment.id}
              className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingAssessmentId === assessment.id ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Elimina
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="clinical-page">
      <PageHeader
        title="Assessment Gap Analysis"
        description="Worklist degli assessment Gap attivi e archivio separato per le valutazioni chiuse dallo spazio operativo."
        eyebrow="Gap Analysis"
        icon={<ClipboardList className="h-6 w-6" />}
        actions={(
          <button
            type="button"
            onClick={() => setShowCreatePanel((current) => !current)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 font-medium text-white transition hover:bg-teal-700"
          >
            <Plus className="h-5 w-5" />
            {showCreatePanel ? 'Chiudi form' : 'Nuovo assessment'}
          </button>
        )}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {showCreatePanel && (
        <div className="mb-8">
          <GapAssessmentCreatePanel
            onCancel={() => setShowCreatePanel(false)}
            onCreated={(assessment) => navigate(`/gap/assessment/${assessment.id}`)}
          />
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Assessment attivi"
          value={activeAssessments.length}
          icon={<FileText className="h-6 w-6" />}
          tone="clinical"
        />
        <StatCard
          label="Completati attivi"
          value={completedAssessments}
          icon={<CalendarDays className="h-6 w-6" />}
          tone="success"
        />
        <StatCard
          label="Compliance media attivi"
          value={formatCompliance(averageCompliance)}
          icon={<Percent className="h-6 w-6" />}
          tone="neutral"
        />
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setAssessmentView('active')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                assessmentView === 'active'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-teal-700'
              }`}
            >
              Assessment
              <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
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
              ? 'Bozze, assessment in corso e completati ancora nella worklist.'
              : 'Assessment tolti dalla worklist principale. Puoi consultarli o riportarli in lavorazione cambiando stato.'}
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            Caricamento assessment Gap Analysis...
          </CardContent>
        </Card>
      ) : assessments.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Nessun assessment Gap disponibile"
          description="La lista sara popolata quando verranno creati assessment Gap Analysis."
          action={(
            <button
              type="button"
              onClick={() => setShowCreatePanel(true)}
              className="inline-flex items-center gap-2 font-medium text-teal-700 hover:text-teal-800"
            >
              <Plus className="h-4 w-4" />
              Crea assessment Gap
            </button>
          )}
        />
      ) : visibleAssessments.length === 0 ? (
        <EmptyState
          icon={assessmentView === 'active' ? <ClipboardList className="h-6 w-6" /> : <Archive className="h-6 w-6" />}
          title={assessmentView === 'active' ? 'Nessun assessment attivo' : 'Nessun assessment archiviato'}
          description={assessmentView === 'active'
            ? 'Gli assessment archiviati restano disponibili nella vista Archivio assessment.'
            : 'Quando archivi una valutazione, questa verra mostrata qui e rimossa dalla worklist.'}
        />
      ) : (
        <div className="grid gap-4">
          {visibleAssessments.map((assessment) => renderAssessmentCard(assessment))}
        </div>
      )}
    </div>
  )
}
