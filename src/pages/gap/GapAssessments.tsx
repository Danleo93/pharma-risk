import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CalendarDays, ClipboardList, FileText, Percent, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getGapAssessments } from '../../services/gapService'
import type { GapAssessment } from '../../types/gap'
import { getGapAssessmentStatusColor, getGapAssessmentStatusLabel } from '../../lib/labels'
import { GapAssessmentCreatePanel } from '../../components/gap/GapAssessmentCreatePanel'
import { Card, CardContent } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'

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

  const completedAssessments = assessments.filter((assessment) => assessment.status === 'completed').length
  const averageCompliance = assessments.length > 0
    ? assessments.reduce((sum, assessment) => sum + (assessment.compliance_percentage || 0), 0) / assessments.length
    : 0

  return (
    <div className="clinical-page">
      <PageHeader
        title="Assessment Gap Analysis"
        description="Elenco read-only degli assessment Gap e del relativo livello di conformita."
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
          label="Assessment"
          value={assessments.length}
          icon={<FileText className="h-6 w-6" />}
          tone="clinical"
        />
        <StatCard
          label="Completati"
          value={completedAssessments}
          icon={<CalendarDays className="h-6 w-6" />}
          tone="success"
        />
        <StatCard
          label="Compliance media"
          value={formatCompliance(averageCompliance)}
          icon={<Percent className="h-6 w-6" />}
          tone="neutral"
        />
      </div>

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
      ) : (
        <div className="grid gap-4">
          {assessments.map((assessment) => (
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
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${getGapAssessmentStatusColor(assessment.status)}`}>
                      {getGapAssessmentStatusLabel(assessment.status)}
                    </span>
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
