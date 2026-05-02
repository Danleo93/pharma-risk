import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, ExternalLink, Search, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { isGapActionOverdue } from '../../lib/gapScoring'
import {
  GAP_ACTION_PHASE_OPTIONS,
  GAP_ACTION_PRIORITY_OPTIONS,
  GAP_ACTION_STATUS_OPTIONS,
  GAP_VERIFICATION_RESULT_OPTIONS,
  getGapActionPriorityColor,
  getGapActionPriorityLabel,
  getGapActionStatusColor,
  getGapActionStatusLabel,
  getGapVerificationResultColor,
  getGapVerificationResultLabel,
} from '../../lib/labels'
import { getGapActions, getGapAssessments } from '../../services/gapService'
import type {
  GapAction,
  GapActionPriority,
  GapActionStatus,
  GapAssessment,
  GapVerificationResult,
} from '../../types/gap'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'

type StatusFilter = 'all' | GapActionStatus
type PriorityFilter = 'all' | GapActionPriority
type VerificationFilter = 'all' | GapVerificationResult
type OverdueFilter = 'all' | 'overdue' | 'not_overdue'

const formatDate = (value: string | null) => {
  return value ? new Date(value).toLocaleDateString('it-IT') : 'N/D'
}

export default function GapActions() {
  const { user } = useAuth()
  const [actions, setActions] = useState<GapAction[]>([])
  const [assessments, setAssessments] = useState<GapAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [responsibleFilter, setResponsibleFilter] = useState('all')
  const [overdueFilter, setOverdueFilter] = useState<OverdueFilter>('all')
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user?.id) return

    let active = true

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [actionsData, assessmentsData] = await Promise.all([
          getGapActions(user.id),
          getGapAssessments(user.id),
        ])

        if (!active) return
        setActions(actionsData)
        setAssessments(assessmentsData)
      } catch (fetchError) {
        console.error('Errore caricamento azioni Gap:', fetchError)
        if (active) setError('Impossibile caricare il registro azioni Gap.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchData()

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

  const responsibleOptions = useMemo(() => {
    return Array.from(new Set(actions.map((action) => action.responsible).filter(Boolean) as string[]))
      .sort((a, b) => a.localeCompare(b))
  }, [actions])

  const stats = useMemo(() => {
    return {
      total: actions.length,
      open: actions.filter((action) => !['completed', 'verified', 'closed'].includes(action.status)).length,
      completed: actions.filter((action) => action.status === 'completed').length,
      verified: actions.filter((action) => action.status === 'verified').length,
      overdue: actions.filter((action) => isGapActionOverdue(action)).length,
      pendingVerification: actions.filter((action) =>
        action.status === 'completed' && action.verification_result === 'pending',
      ).length,
    }
  }, [actions])

  const filteredActions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return actions.filter((action) => {
      const overdue = isGapActionOverdue(action)
      const assessment = assessmentById[action.assessment_id]
      const searchableText = [
        action.description,
        action.responsible,
        action.notes,
        assessment?.title,
        assessment?.department,
        assessment?.facility_name,
      ].filter(Boolean).join(' ').toLowerCase()

      const matchesStatus = statusFilter === 'all' || action.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || action.priority === priorityFilter
      const matchesResponsible = responsibleFilter === 'all' || action.responsible === responsibleFilter
      const matchesVerification = verificationFilter === 'all' || action.verification_result === verificationFilter
      const matchesOverdue =
        overdueFilter === 'all' ||
        (overdueFilter === 'overdue' && overdue) ||
        (overdueFilter === 'not_overdue' && !overdue)
      const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch)

      return (
        matchesStatus &&
        matchesPriority &&
        matchesResponsible &&
        matchesVerification &&
        matchesOverdue &&
        matchesSearch
      )
    })
  }, [
    actions,
    assessmentById,
    overdueFilter,
    priorityFilter,
    responsibleFilter,
    search,
    statusFilter,
    verificationFilter,
  ])

  if (loading) {
    return (
      <div className="clinical-page">
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            Caricamento registro azioni Gap...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title="Azioni Gap"
        description="Registro globale read-only delle azioni correttive Gap Analysis dell'utente."
        eyebrow="Gap Analysis"
        icon={<CheckSquare className="h-6 w-6" />}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Totale" value={stats.total} icon={<CheckSquare className="h-6 w-6" />} tone="clinical" />
        <StatCard label="Aperte" value={stats.open} icon={<CheckSquare className="h-6 w-6" />} tone="neutral" />
        <StatCard label="Completate" value={stats.completed} icon={<CheckSquare className="h-6 w-6" />} tone="success" />
        <StatCard label="Verificate" value={stats.verified} icon={<ShieldCheck className="h-6 w-6" />} tone="success" />
        <StatCard label="Scadute" value={stats.overdue} icon={<CheckSquare className="h-6 w-6" />} tone="risk" />
        <StatCard label="Verifica pending" value={stats.pendingVerification} icon={<ShieldCheck className="h-6 w-6" />} tone="neutral" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtri registro</CardTitle>
          <CardDescription>
            La pagina e in sola lettura. Modifica e verifica efficacia restano disponibili nel dettaglio assessment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-6">
            <label className="block lg:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Cerca</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="clinical-input pl-9"
                  placeholder="Descrizione, Responsabile/i, assessment..."
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Stato</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="clinical-input"
              >
                <option value="all">Tutti</option>
                {GAP_ACTION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Priorita</span>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
                className="clinical-input"
              >
                <option value="all">Tutte</option>
                {GAP_ACTION_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Responsabile/i</span>
              <select
                value={responsibleFilter}
                onChange={(event) => setResponsibleFilter(event.target.value)}
                className="clinical-input"
              >
                <option value="all">Tutti</option>
                {responsibleOptions.map((responsible) => (
                  <option key={responsible} value={responsible}>{responsible}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Scadenza</span>
              <select
                value={overdueFilter}
                onChange={(event) => setOverdueFilter(event.target.value as OverdueFilter)}
                className="clinical-input"
              >
                <option value="all">Tutte</option>
                <option value="overdue">Solo scadute</option>
                <option value="not_overdue">Non scadute</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Verifica</span>
              <select
                value={verificationFilter}
                onChange={(event) => setVerificationFilter(event.target.value as VerificationFilter)}
                className="clinical-input"
              >
                <option value="all">Tutte</option>
                {GAP_VERIFICATION_RESULT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      {actions.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-6 w-6" />}
          title="Nessuna azione Gap"
          description="Le azioni vengono create dal dettaglio assessment, a partire da gap non conformi o parzialmente conformi."
        />
      ) : filteredActions.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Nessuna azione corrisponde ai filtri"
          description="Modifica ricerca o filtri per visualizzare altre azioni."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.4fr_1fr_0.9fr_0.8fr_0.8fr_0.8fr_1fr_1fr_auto] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 xl:grid">
            <span>Descrizione</span>
            <span>Assessment</span>
            <span>Responsabile/i</span>
            <span>Priorita</span>
            <span>Stato</span>
            <span>Progress</span>
            <span>Date</span>
            <span>Verifica</span>
            <span>Link</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredActions.map((action) => {
              const assessment = assessmentById[action.assessment_id]
              const overdue = isGapActionOverdue(action)
              const phaseLabel = GAP_ACTION_PHASE_OPTIONS.find((option) => option.value === action.phase)?.label

              return (
                <div key={action.id} className="grid gap-4 p-4 xl:grid-cols-[1.4fr_1fr_0.9fr_0.8fr_0.8fr_0.8fr_1fr_1fr_auto] xl:items-start">
                  <div>
                    <p className="font-semibold text-slate-950">{action.description}</p>
                    {phaseLabel && (
                      <p className="mt-2 text-xs text-slate-500">Fase: {phaseLabel}</p>
                    )}
                    {action.notes && (
                      <p className="mt-1 text-sm leading-6 text-slate-500">{action.notes}</p>
                    )}
                  </div>

                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-800">{assessment?.title || 'Assessment non disponibile'}</p>
                    {assessment?.department && (
                      <p className="mt-1 text-xs text-slate-500">{assessment.department}</p>
                    )}
                  </div>

                  <div className="text-sm text-slate-600">
                    {action.responsible || 'Non assegnato'}
                  </div>

                  <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getGapActionPriorityColor(action.priority)}`}>
                      {getGapActionPriorityLabel(action.priority)}
                    </span>
                  </div>

                  <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getGapActionStatusColor(action.status)}`}>
                      {getGapActionStatusLabel(action.status)}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-700">
                    {action.progress}%
                  </div>

                  <div className="text-sm text-slate-600">
                    <p>{formatDate(action.planned_start_date)} - {formatDate(action.planned_end_date)}</p>
                    {overdue && (
                      <span className="mt-2 inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                        Scaduta
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-slate-600">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getGapVerificationResultColor(action.verification_result)}`}>
                      {getGapVerificationResultLabel(action.verification_result)}
                    </span>
                    {action.verification_due_date && (
                      <p className="mt-2 text-xs text-slate-500">Entro: {formatDate(action.verification_due_date)}</p>
                    )}
                    {action.verified_at && (
                      <p className="mt-1 text-xs text-slate-500">Verificata: {new Date(action.verified_at).toLocaleDateString('it-IT')}</p>
                    )}
                  </div>

                  <div className="flex justify-start xl:justify-end">
                    <Link
                      to={`/gap/assessment/${action.assessment_id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-teal-100 bg-white text-teal-700 transition hover:bg-teal-50"
                      aria-label="Apri assessment collegato"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
