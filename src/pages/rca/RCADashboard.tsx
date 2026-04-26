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

interface RCADashboardCause {
  id: string
  is_root_cause: boolean
}

interface RCADashboardFiveWhyChain {
  id: string
}

interface RCADashboardAction {
  id: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  due_date: string | null
}

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

const getStatusColor = (status: RCAAssessmentStatus) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700'
    case 'action_planned':
      return 'bg-sky-100 text-sky-700'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-700'
    case 'archived':
      return 'bg-gray-100 text-gray-600'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const getSeverityColor = (severity: RCASeverity) => {
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
        .select('id, is_root_cause')
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
    planned: actions.filter((action) => action.status === 'planned').length,
    inProgress: actions.filter((action) => action.status === 'in_progress').length,
    completed: actions.filter((action) => action.status === 'completed').length,
    cancelled: actions.filter((action) => action.status === 'cancelled').length,
    overdue: actions.filter((action) =>
      Boolean(action.due_date) &&
      action.due_date! < today &&
      action.status !== 'completed' &&
      action.status !== 'cancelled',
    ).length,
  }

  const candidateCauses = causes.filter((cause) => cause.is_root_cause).length
  const latestAssessments = assessments.slice(0, 5)

  const metricCards = [
    {
      label: 'Assessment RCA',
      value: assessments.length,
      icon: FileText,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      label: 'Cause totali',
      value: causes.length,
      icon: Target,
      color: 'bg-sky-100 text-sky-600',
    },
    {
      label: 'Cause candidate',
      value: candidateCauses,
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
    },
    {
      label: '5 Whys avviate',
      value: fiveWhyChains.length,
      icon: ListChecks,
      color: 'bg-violet-100 text-violet-600',
    },
    {
      label: 'Azioni scadute',
      value: actionCounts.overdue,
      icon: CalendarClock,
      color: 'bg-rose-100 text-rose-600',
    },
  ]

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento dashboard RCA...
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard RCA</h1>
          <p className="text-gray-500 mt-1">Metriche operative della Root Cause Analysis.</p>
        </div>
        <Link
          to="/rca/assessment/new"
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-lg font-medium transition"
        >
          <Plus className="w-5 h-5" />
          Nuovo Assessment
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {assessments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center mb-8">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">Nessun dato RCA disponibile</h2>
          <p className="text-gray-500 mt-2 mb-6">
            Crea il primo assessment RCA per popolare dashboard, cause, 5 Whys e azioni correttive.
          </p>
          <Link
            to="/rca/assessment/new"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Crea assessment RCA
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {metricCards.map((card) => {
              const Icon = card.icon

              return (
                <div key={card.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">{card.label}</p>
                      <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="font-semibold text-gray-800">Assessment per stato</h2>
              </div>

              <div className="space-y-3">
                {Object.entries(assessmentStatusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status as RCAAssessmentStatus)}`}>
                      {statusLabels[status as RCAAssessmentStatus]}
                    </span>
                    <span className="text-lg font-semibold text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="font-semibold text-gray-800">Eventi per severita</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(severityCounts).map(([severity, count]) => (
                  <div key={severity} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(severity as RCASeverity)}`}>
                      {severityLabels[severity as RCASeverity]}
                    </span>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{count}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-sky-100 p-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-sky-600" />
                </div>
                <h2 className="font-semibold text-gray-800">Azioni correttive</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-2xl font-bold text-blue-700">{actionCounts.planned}</p>
                  <p className="text-xs text-gray-500">Pianificate</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-3">
                  <p className="text-2xl font-bold text-yellow-700">{actionCounts.inProgress}</p>
                  <p className="text-xs text-gray-500">In corso</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-2xl font-bold text-green-700">{actionCounts.completed}</p>
                  <p className="text-xs text-gray-500">Completate</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-2xl font-bold text-gray-700">{actionCounts.cancelled}</p>
                  <p className="text-xs text-gray-500">Annullate</p>
                </div>
                <div className="col-span-2 rounded-lg bg-rose-50 p-3">
                  <p className="text-2xl font-bold text-rose-700">{actionCounts.overdue}</p>
                  <p className="text-xs text-gray-500">Scadute non completate</p>
                </div>
              </div>
            </section>
          </div>

          <section className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Ultimi assessment RCA</h2>
                <p className="text-sm text-gray-500 mt-1">Accesso rapido agli eventi piu recenti.</p>
              </div>
              <Link to="/rca/assessments" className="text-sm font-medium text-orange-600 hover:text-orange-700">
                Vedi tutti
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {latestAssessments.map((assessment) => (
                <Link
                  key={assessment.id}
                  to={`/rca/assessment/${assessment.id}`}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-5 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 rounded-lg bg-orange-50 p-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{assessment.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{assessment.event_title}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Creato il {formatDate(assessment.created_at)}
                        {assessment.event_date && ` - Evento: ${formatDate(assessment.event_date)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment.status)}`}>
                      {statusLabels[assessment.status]}
                    </span>
                    {assessment.severity && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(assessment.severity)}`}>
                        {severityLabels[assessment.severity]}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
