import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Activity, ClipboardList, FileText, ListChecks } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getGapActionsByAssessment, getGapAssessments } from '../../services/gapService'
import type { GapAction, GapAssessment } from '../../types/gap'
import { getGapAssessmentStatusColor, getGapAssessmentStatusLabel } from '../../lib/labels'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'

const formatDate = (date: string | null) => {
  return date ? new Date(date).toLocaleDateString('it-IT') : 'N/D'
}

const formatCompliance = (value: number | null | undefined) => {
  return `${Math.round(value || 0)}%`
}

export default function GapDashboard() {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState<GapAssessment[]>([])
  const [actions, setActions] = useState<GapAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)

      try {
        const assessmentsData = await getGapAssessments(user.id)
        const actionsByAssessment = await Promise.all(
          assessmentsData.map((assessment) => getGapActionsByAssessment(assessment.id, user.id)),
        )

        setAssessments(assessmentsData)
        setActions(actionsByAssessment.flat())
      } catch (fetchError) {
        console.error('Errore caricamento dashboard Gap Analysis:', fetchError)
        setError('Impossibile caricare le metriche Gap Analysis.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id])

  const latestAssessments = assessments.slice(0, 5)
  const inProgressActions = actions.filter((action) => action.status === 'in_progress').length

  if (loading) {
    return (
      <div className="clinical-page">
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            Caricamento dashboard Gap Analysis...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title="Dashboard Gap Analysis"
        description="Panoramica read-only degli assessment Gap e delle azioni di adeguamento."
        eyebrow="Gap Analysis"
        icon={<ClipboardList className="h-6 w-6" />}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {assessments.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Nessun assessment Gap disponibile"
          description="Quando saranno creati assessment Gap Analysis, qui compariranno metriche, stato di avanzamento e ultimi assessment."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label="Assessment"
              value={assessments.length}
              icon={<FileText className="h-6 w-6" />}
              tone="clinical"
            />
            <StatCard
              label="Azioni totali"
              value={actions.length}
              icon={<ListChecks className="h-6 w-6" />}
              tone="neutral"
            />
            <StatCard
              label="Azioni in corso"
              value={inProgressActions}
              icon={<Activity className="h-6 w-6" />}
              tone="success"
            />
          </div>

          <Card>
            <CardHeader
              actions={(
                <Link to="/gap/assessments" className="text-sm font-medium text-teal-700 hover:text-teal-800">
                  Vedi tutti
                </Link>
              )}
            >
              <CardTitle>Ultimi assessment Gap</CardTitle>
              <CardDescription>Accesso rapido agli assessment piu recenti.</CardDescription>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {latestAssessments.map((assessment) => (
                <div key={assessment.id} className="p-5 transition hover:bg-slate-50">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-900">{assessment.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {assessment.department || assessment.facility_name || 'Struttura non specificata'}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Data assessment: {formatDate(assessment.assessment_date)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${getGapAssessmentStatusColor(assessment.status)}`}>
                        {getGapAssessmentStatusLabel(assessment.status)}
                      </span>
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
                        {formatCompliance(assessment.compliance_percentage)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
