import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  CheckSquare,
  ClipboardList,
  FileText,
  Percent,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { calculateCompliancePercentage, isGapActionOverdue } from '../../lib/gapScoring'
import {
  getComplianceStatusColor,
  getComplianceStatusLabel,
  getGapActionPriorityColor,
  getGapActionPriorityLabel,
  getGapActionStatusColor,
  getGapActionStatusLabel,
  getGapAssessmentStatusColor,
  getGapAssessmentStatusLabel,
} from '../../lib/labels'
import { getGapActions, getGapAssessments, getGapEvaluations } from '../../services/gapService'
import type { GapAction, GapActivityEvaluation, GapAssessment } from '../../types/gap'
import { GapActionStatusChart } from '../../components/gap/GapActionStatusChart'
import { GapComplianceChart } from '../../components/gap/GapComplianceChart'
import { GapPriorityChart } from '../../components/gap/GapPriorityChart'
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

const isGapFinding = (evaluation: GapActivityEvaluation) => {
  return ['non_compliant', 'partially_compliant'].includes(evaluation.compliance_status)
}

const dashboardLinkClass = 'text-sm font-medium text-teal-700 transition hover:text-teal-800'

export default function GapDashboard() {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState<GapAssessment[]>([])
  const [evaluations, setEvaluations] = useState<GapActivityEvaluation[]>([])
  const [actions, setActions] = useState<GapAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    let active = true

    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [assessmentsData, evaluationsData, actionsData] = await Promise.all([
          getGapAssessments(user.id),
          getGapEvaluations(user.id),
          getGapActions(user.id),
        ])

        if (!active) return
        setAssessments(assessmentsData)
        setEvaluations(evaluationsData)
        setActions(actionsData)
      } catch (fetchError) {
        console.error('Errore caricamento dashboard Gap Analysis:', fetchError)
        if (active) setError('Impossibile caricare le metriche Gap Analysis.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchDashboardData()

    return () => {
      active = false
    }
  }, [user?.id])

  const assessmentById = useMemo(() => {
    return assessments.reduce<Record<string, GapAssessment>>((acc, assessment) => ({
      ...acc,
      [assessment.id]: assessment,
    }), {})
  }, [assessments])

  const dashboardStats = useMemo(() => {
    const gapFindings = evaluations.filter(isGapFinding)
    const openActions = actions.filter((action) => !['completed', 'verified', 'closed'].includes(action.status))

    return {
      totalAssessments: assessments.length,
      averageCompliance: calculateCompliancePercentage(evaluations),
      openGaps: gapFindings.length,
      highPriorityGaps: gapFindings.filter((evaluation) => evaluation.risk_priority === 'high').length,
      openActions: openActions.length,
      overdueActions: actions.filter((action) => isGapActionOverdue(action)).length,
      pendingVerifications: actions.filter((action) =>
        action.status === 'completed' && action.verification_result === 'pending',
      ).length,
    }
  }, [actions, assessments.length, evaluations])

  const latestAssessments = assessments.slice(0, 5)
  const topHighPriorityGaps = evaluations
    .filter((evaluation) => isGapFinding(evaluation) && evaluation.risk_priority === 'high')
    .sort((a, b) => {
      if (a.compliance_status !== b.compliance_status) {
        return a.compliance_status === 'non_compliant' ? -1 : 1
      }

      return (b.evaluated_at || b.updated_at || '').localeCompare(a.evaluated_at || a.updated_at || '')
    })
    .slice(0, 5)
  const overdueActions = actions
    .filter((action) => isGapActionOverdue(action))
    .slice(0, 5)
  const pendingVerifications = actions
    .filter((action) => action.status === 'completed' && action.verification_result === 'pending')
    .sort((a, b) => (a.verification_due_date || '9999-12-31').localeCompare(b.verification_due_date || '9999-12-31'))
    .slice(0, 5)

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
        description="Vista operativa su assessment, gap rilevati e azioni da seguire."
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
          description="Crea il primo assessment Gap per visualizzare KPI, grafici e priorità operative."
          action={(
            <Link
              to="/gap/assessments"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800"
            >
              Vai agli assessment
            </Link>
          )}
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-7">
            <StatCard
              label="Assessment"
              value={dashboardStats.totalAssessments}
              icon={<FileText className="h-6 w-6" />}
              tone="clinical"
            />
            <StatCard
              label="Compliance media"
              value={`${dashboardStats.averageCompliance}%`}
              icon={<Percent className="h-6 w-6" />}
              tone="success"
            />
            <StatCard
              label="Gap aperti"
              value={dashboardStats.openGaps}
              icon={<AlertTriangle className="h-6 w-6" />}
              tone="risk"
            />
            <StatCard
              label="Gap alta priorità"
              value={dashboardStats.highPriorityGaps}
              icon={<AlertTriangle className="h-6 w-6" />}
              tone="risk"
            />
            <StatCard
              label="Azioni aperte"
              value={dashboardStats.openActions}
              icon={<CheckSquare className="h-6 w-6" />}
              tone="neutral"
            />
            <StatCard
              label="Azioni scadute"
              value={dashboardStats.overdueActions}
              icon={<CheckSquare className="h-6 w-6" />}
              tone="risk"
            />
            <StatCard
              label="Verifiche pending"
              value={dashboardStats.pendingVerifications}
              icon={<ShieldCheck className="h-6 w-6" />}
              tone="neutral"
            />
          </div>

          <div className="mb-6 grid gap-6 xl:grid-cols-2">
            <GapComplianceChart evaluations={evaluations} />
            <GapPriorityChart evaluations={evaluations} />
            <GapActionStatusChart actions={actions} mode="status" />
            <GapActionStatusChart actions={actions} mode="verification" />
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-950">Priorità operative</h2>
            <p className="mt-1 text-sm text-slate-500">
              Elementi recenti o critici da aprire per completare valutazioni, azioni e verifiche.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader
                actions={(
                  <Link to="/gap/assessments" className={dashboardLinkClass}>
                    Vedi tutti
                  </Link>
                )}
              >
                <CardTitle>Ultimi assessment Gap</CardTitle>
                <CardDescription>Assessment più recenti da consultare o completare.</CardDescription>
              </CardHeader>
              <div className="divide-y divide-slate-100">
                {latestAssessments.map((assessment) => (
                  <Link
                    key={assessment.id}
                    to={`/gap/assessment/${assessment.id}`}
                    className="block p-5 transition hover:bg-slate-50"
                  >
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
                  </Link>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top gap ad alta priorità</CardTitle>
                <CardDescription>Gap critici da valutare per priorità di intervento.</CardDescription>
              </CardHeader>
              {topHighPriorityGaps.length === 0 ? (
                <CardContent>
                  <EmptyState
                    icon={<AlertTriangle className="h-6 w-6" />}
                    title="Nessun gap alta priorità"
                    description="I gap ad alta priorità compariranno quando una valutazione risulta non conforme o parziale."
                  />
                </CardContent>
              ) : (
                <div className="divide-y divide-slate-100">
                  {topHighPriorityGaps.map((evaluation) => (
                    <Link
                      key={evaluation.id}
                      to={`/gap/assessment/${evaluation.assessment_id}`}
                      className="block p-5 transition hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-400">
                            {evaluation.activity_code_snapshot || 'Senza codice'}
                          </p>
                          <h3 className="mt-1 font-semibold text-slate-900">
                            {evaluation.activity_name_snapshot || 'Attività/Requisito'}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {evaluation.process_name_snapshot || 'Processo non specificato'} - {evaluation.area_name_snapshot || 'Dominio/Sezione non specificato'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 md:justify-end">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${getComplianceStatusColor(evaluation.compliance_status)}`}>
                            {getComplianceStatusLabel(evaluation.compliance_status)}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${getGapActionPriorityColor('high')}`}>
                            {getGapActionPriorityLabel('high')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader
                actions={(
                  <Link to="/gap/actions" className={dashboardLinkClass}>
                    Vedi azioni
                  </Link>
                )}
              >
                <CardTitle>Azioni scadute</CardTitle>
                <CardDescription>Azioni aperte che richiedono recupero operativo.</CardDescription>
              </CardHeader>
              {overdueActions.length === 0 ? (
                <CardContent>
                  <EmptyState
                    icon={<CheckSquare className="h-6 w-6" />}
                    title="Nessuna azione scaduta"
                    description="Non risultano azioni aperte oltre la data pianificata."
                    action={(
                      <Link to="/gap/actions" className={dashboardLinkClass}>
                        Apri registro azioni
                      </Link>
                    )}
                  />
                </CardContent>
              ) : (
                <div className="divide-y divide-slate-100">
                  {overdueActions.map((action) => {
                    const assessment = assessmentById[action.assessment_id]

                    return (
                      <Link
                        key={action.id}
                        to={`/gap/assessment/${action.assessment_id}`}
                        className="block p-5 transition hover:bg-slate-50"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900">{action.description}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {assessment?.title || 'Assessment non disponibile'}
                            </p>
                            <p className="mt-2 text-xs text-red-600">
                              Scadenza: {formatDate(action.planned_end_date)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 md:justify-end">
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getGapActionStatusColor(action.status)}`}>
                              {getGapActionStatusLabel(action.status)}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getGapActionPriorityColor(action.priority)}`}>
                              {getGapActionPriorityLabel(action.priority)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader
                actions={(
                  <Link to="/gap/actions" className={dashboardLinkClass}>
                    Vedi azioni
                  </Link>
                )}
              >
                <CardTitle>Verifiche pending</CardTitle>
                <CardDescription>Azioni completate da verificare per efficacia.</CardDescription>
              </CardHeader>
              {pendingVerifications.length === 0 ? (
                <CardContent>
                  <EmptyState
                    icon={<ShieldCheck className="h-6 w-6" />}
                    title="Nessuna verifica pending"
                    description="Non risultano azioni completate in attesa di verifica efficacia."
                    action={(
                      <Link to="/gap/actions" className={dashboardLinkClass}>
                        Apri registro azioni
                      </Link>
                    )}
                  />
                </CardContent>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingVerifications.map((action) => {
                    const assessment = assessmentById[action.assessment_id]

                    return (
                      <Link
                        key={action.id}
                        to={`/gap/assessment/${action.assessment_id}`}
                        className="block p-5 transition hover:bg-slate-50"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900">{action.description}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {assessment?.title || 'Assessment non disponibile'}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                              Verifica entro: {formatDate(action.verification_due_date)}
                            </p>
                          </div>
                          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            Pending
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
