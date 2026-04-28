import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  CheckCircle,
  Clock,
  FileText,
  ListChecks,
  Plus,
  Target,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { RCAAssessment, RCAAssessmentStatus, RCASeverity } from '../../types'
import {
  getEffectiveRootCauseStatus,
  getRCAAssessmentStatusColor,
  getRCAAssessmentStatusLabel,
  getRCASeverityColor,
  getRCASeverityLabel,
  normalizeRCAActionStatus,
  type RootCauseStatus,
} from '../../lib/labels'
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'

interface RCADashboardCause {
  id: string
  is_root_cause: boolean
  root_cause_status: RootCauseStatus | null
}

interface RCADashboardFiveWhyChain {
  id: string
}

interface RCADashboardAction {
  id: string
  status: string
  due_date: string | null
}

const formatDate = (date: string | null) => {
  return date ? new Date(date).toLocaleDateString('it-IT') : 'N/D'
}

export default function RCADashboard() {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState<RCAAssessment[]>([])
  const [causes, setCauses] = useState<RCADashboardCause[]>([])
  const [fiveWhyChains, setFiveWhyChains] = useState<RCADashboardFiveWhyChain[]>([])
  const [actions, setActions] = useState<RCADashboardAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchDashboardData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    const [
      assessmentsResponse,
      causesResponse,
      fiveWhyChainsResponse,
      actionsResponse,
    ] = await Promise.all([
      supabase
        .from('rca_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('rca_causes')
        .select('id, is_root_cause, root_cause_status')
        .eq('user_id', user.id),
      supabase
        .from('rca_five_why_chains')
        .select('id')
        .eq('user_id', user.id),
      supabase
        .from('rca_action_plans')
        .select('id, status, due_date')
        .eq('user_id', user.id),
    ])

    const firstError =
      assessmentsResponse.error ||
      causesResponse.error ||
      fiveWhyChainsResponse.error ||
      actionsResponse.error

    if (firstError) {
      console.error('Errore caricamento dashboard RCA:', firstError)
      setError('Impossibile caricare le metriche RCA.')
      setLoading(false)
      return
    }

    setAssessments((assessmentsResponse.data || []) as RCAAssessment[])
    setCauses((causesResponse.data || []) as RCADashboardCause[])
    setFiveWhyChains((fiveWhyChainsResponse.data || []) as RCADashboardFiveWhyChain[])
    setActions((actionsResponse.data || []) as RCADashboardAction[])
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  const assessmentStatusCounts: Record<RCAAssessmentStatus, number> = {
    draft: assessments.filter((assessment) => assessment.status === 'draft').length,
    in_progress: assessments.filter((assessment) => assessment.status === 'in_progress').length,
    action_planned: assessments.filter((assessment) => assessment.status === 'action_planned').length,
    completed: assessments.filter((assessment) => assessment.status === 'completed').length,
    archived: assessments.filter((assessment) => assessment.status === 'archived').length,
  }

  const severityCounts: Record<RCASeverity, number> = {
    low: assessments.filter((assessment) => assessment.severity === 'low').length,
    medium: assessments.filter((assessment) => assessment.severity === 'medium').length,
    high: assessments.filter((assessment) => assessment.severity === 'high').length,
    critical: assessments.filter((assessment) => assessment.severity === 'critical').length,
  }

  const actionCounts = {
    planned: actions.filter((action) => normalizeRCAActionStatus(action.status) === 'planned').length,
    inProgress: actions.filter((action) => normalizeRCAActionStatus(action.status) === 'in_progress').length,
    completed: actions.filter((action) => normalizeRCAActionStatus(action.status) === 'completed').length,
    overdue: actions.filter((action) =>
      Boolean(action.due_date) &&
      action.due_date! < today &&
      normalizeRCAActionStatus(action.status) !== 'completed',
    ).length,
  }

  const candidateCauses = causes.filter((cause) => getEffectiveRootCauseStatus(cause) === 'candidate').length
  const confirmedRootCauses = causes.filter((cause) => getEffectiveRootCauseStatus(cause) === 'confirmed').length
  const notConfirmedRootCauses = causes.filter((cause) => getEffectiveRootCauseStatus(cause) === 'not_confirmed').length
  const latestAssessments = assessments.slice(0, 5)

  const metricCards = [
    {
      label: 'Assessment RCA',
      value: assessments.length,
      icon: FileText,
      tone: 'rca' as const,
    },
    {
      label: 'Cause totali',
      value: causes.length,
      icon: Target,
      tone: 'clinical' as const,
    },
    {
      label: 'Cause candidate',
      value: candidateCauses,
      icon: AlertTriangle,
      tone: 'risk' as const,
    },
    {
      label: 'Root cause confermate',
      value: confirmedRootCauses,
      icon: CheckCircle,
      tone: 'success' as const,
    },
    {
      label: 'Cause non confermate',
      value: notConfirmedRootCauses,
      icon: AlertCircle,
      tone: 'neutral' as const,
    },
    {
      label: '5 Whys avviate',
      value: fiveWhyChains.length,
      icon: ListChecks,
      tone: 'clinical' as const,
    },
    {
      label: 'Azioni scadute',
      value: actionCounts.overdue,
      icon: CalendarClock,
      tone: 'risk' as const,
    },
  ]

  if (loading) {
    return (
      <div className="clinical-page">
        <div className="clinical-card p-12 text-center text-slate-500">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento dashboard RCA...
        </div>
      </div>
    )
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title="Dashboard RCA"
        description="Metriche operative della Root Cause Analysis."
        eyebrow="Analisi Reattiva"
        actions={(
          <Link
            to="/rca/assessment/new"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-3 font-medium text-white transition hover:bg-orange-700"
          >
            <Plus className="w-5 h-5" />
            Nuovo Assessment
          </Link>
        )}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {assessments.length === 0 ? (
        <EmptyState
          className="mb-8"
          icon={<AlertCircle className="w-6 h-6" />}
          title="Nessun dato RCA disponibile"
          description="Crea il primo assessment RCA per popolare dashboard, cause, 5 Whys e azioni correttive."
          action={(
            <Link
              to="/rca/assessment/new"
              className="inline-flex items-center gap-2 text-orange-700 hover:text-orange-800 font-medium"
            >
              <Plus className="w-4 h-4" />
              Crea assessment RCA
            </Link>
          )}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {metricCards.map((card) => {
              const Icon = card.icon

              return (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  icon={<Icon className="w-6 h-6" />}
                  tone={card.tone}
                />
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-orange-50 text-orange-700 p-2 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-slate-900">Assessment per stato</h2>
              </div>

              <div className="space-y-3">
                {Object.entries(assessmentStatusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRCAAssessmentStatusColor(status as RCAAssessmentStatus)}`}>
                      {getRCAAssessmentStatusLabel(status as RCAAssessmentStatus)}
                    </span>
                    <span className="text-lg font-semibold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-red-50 text-red-700 p-2 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-slate-900">Eventi per severita</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(severityCounts).map(([severity, count]) => (
                  <div key={severity} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getRCASeverityColor(severity as RCASeverity)}`}>
                      {getRCASeverityLabel(severity as RCASeverity)}
                    </span>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{count}</p>
                  </div>
                ))}
              </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-sky-50 text-sky-700 p-2 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-slate-900">Azioni correttive</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-2xl font-bold text-blue-700">{actionCounts.planned}</p>
                  <p className="text-xs text-slate-500">Pianificate</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-3">
                  <p className="text-2xl font-bold text-yellow-700">{actionCounts.inProgress}</p>
                  <p className="text-xs text-slate-500">In corso</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-2xl font-bold text-green-700">{actionCounts.completed}</p>
                  <p className="text-xs text-slate-500">Completate</p>
                </div>
                <div className="col-span-2 rounded-lg bg-rose-50 p-3">
                  <p className="text-2xl font-bold text-rose-700">{actionCounts.overdue}</p>
                  <p className="text-xs text-slate-500">Scadute non completate</p>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader
              actions={(
              <Link to="/rca/assessments" className="text-sm font-medium text-orange-600 hover:text-orange-700">
                Vedi tutti
              </Link>
              )}
            >
              <CardTitle>Ultimi assessment RCA</CardTitle>
              <CardDescription>Accesso rapido agli eventi piu recenti.</CardDescription>
            </CardHeader>

            <div className="divide-y divide-gray-100">
              {latestAssessments.map((assessment) => (
                <Link
                  key={assessment.id}
                  to={`/rca/assessment/${assessment.id}`}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-5 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 rounded-lg bg-orange-50 p-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{assessment.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{assessment.event_title}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        Creato il {formatDate(assessment.created_at)}
                        {assessment.event_date && ` - Evento: ${formatDate(assessment.event_date)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRCAAssessmentStatusColor(assessment.status)}`}>
                      {getRCAAssessmentStatusLabel(assessment.status)}
                    </span>
                    {assessment.severity && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRCASeverityColor(assessment.severity)}`}>
                        {getRCASeverityLabel(assessment.severity)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
