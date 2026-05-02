import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  FileText,
  Percent,
  Save,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  getGapAssessmentById,
  getGapEvaluationsByAssessment,
  updateGapActivityEvaluation,
  updateGapAssessmentStats,
} from '../../services/gapService'
import type {
  ComplianceStatus,
  GapActivityEvaluation,
  GapAssessment,
  RiskPriority,
} from '../../types/gap'
import { aggregateAssessmentStats } from '../../lib/gapScoring'
import {
  COMPLIANCE_STATUS_OPTIONS,
  RISK_PRIORITY_OPTIONS,
  getComplianceStatusColor,
  getComplianceStatusLabel,
  getGapAssessmentStatusColor,
  getGapAssessmentStatusLabel,
  getGapRiskPriorityColor,
  getGapRiskPriorityLabel,
} from '../../lib/labels'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'

interface EvaluationDraft {
  current_state: string
  target_state_override: string
  gap_description: string
  compliance_status: ComplianceStatus
  risk_priority: RiskPriority
  notes: string
}

interface AreaGroup {
  areaName: string
  evaluations: GapActivityEvaluation[]
}

interface ProcessGroup {
  processName: string
  areas: AreaGroup[]
}

const toNullable = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const toEvaluationDraft = (evaluation: GapActivityEvaluation): EvaluationDraft => ({
  current_state: evaluation.current_state || '',
  target_state_override: evaluation.target_state_override || '',
  gap_description: evaluation.gap_description || '',
  compliance_status: evaluation.compliance_status,
  risk_priority: evaluation.risk_priority,
  notes: evaluation.notes || '',
})

const formatDate = (value: string | null) => {
  return value ? new Date(value).toLocaleDateString('it-IT') : 'N/D'
}

const hasDraftChanges = (evaluation: GapActivityEvaluation, draft: EvaluationDraft | undefined) => {
  if (!draft) return false

  return (
    draft.current_state !== (evaluation.current_state || '') ||
    draft.target_state_override !== (evaluation.target_state_override || '') ||
    draft.gap_description !== (evaluation.gap_description || '') ||
    draft.compliance_status !== evaluation.compliance_status ||
    draft.risk_priority !== evaluation.risk_priority ||
    draft.notes !== (evaluation.notes || '')
  )
}

const groupEvaluations = (evaluations: GapActivityEvaluation[]): ProcessGroup[] => {
  const processMap = new Map<string, Map<string, GapActivityEvaluation[]>>()

  evaluations.forEach((evaluation) => {
    const processName = evaluation.process_name_snapshot || 'Processo non specificato'
    const areaName = evaluation.area_name_snapshot || 'Dominio/Sezione non specificato'
    const areaMap = processMap.get(processName) || new Map<string, GapActivityEvaluation[]>()
    const areaEvaluations = areaMap.get(areaName) || []

    areaMap.set(areaName, [...areaEvaluations, evaluation])
    processMap.set(processName, areaMap)
  })

  return Array.from(processMap.entries()).map(([processName, areaMap]) => ({
    processName,
    areas: Array.from(areaMap.entries()).map(([areaName, areaEvaluations]) => ({
      areaName,
      evaluations: areaEvaluations,
    })),
  }))
}

export default function GapAssessmentDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [assessment, setAssessment] = useState<GapAssessment | null>(null)
  const [evaluations, setEvaluations] = useState<GapActivityEvaluation[]>([])
  const [drafts, setDrafts] = useState<Record<string, EvaluationDraft>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingEvaluationId, setSavingEvaluationId] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !user?.id) return

    let active = true

    const fetchAssessment = async () => {
      setLoading(true)
      setError(null)

      try {
        const [assessmentData, evaluationData] = await Promise.all([
          getGapAssessmentById(id, user.id),
          getGapEvaluationsByAssessment(id, user.id),
        ])

        if (!active) return

        setAssessment(assessmentData)
        setEvaluations(evaluationData)
        setDrafts(
          evaluationData.reduce<Record<string, EvaluationDraft>>((acc, evaluation) => ({
            ...acc,
            [evaluation.id]: toEvaluationDraft(evaluation),
          }), {}),
        )
      } catch (fetchError) {
        console.error('Errore caricamento assessment Gap:', fetchError)
        if (active) setError('Impossibile caricare il dettaglio assessment Gap.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchAssessment()

    return () => {
      active = false
    }
  }, [id, user?.id])

  const groupedEvaluations = useMemo(() => groupEvaluations(evaluations), [evaluations])
  const stats = useMemo(() => aggregateAssessmentStats(evaluations), [evaluations])

  const updateDraft = (
    evaluationId: string,
    patch: Partial<EvaluationDraft>,
  ) => {
    setDrafts((current) => ({
      ...current,
      [evaluationId]: {
        ...current[evaluationId],
        ...patch,
      },
    }))
  }

  const resetDraft = (evaluation: GapActivityEvaluation) => {
    setDrafts((current) => ({
      ...current,
      [evaluation.id]: toEvaluationDraft(evaluation),
    }))
  }

  const saveEvaluation = async (evaluation: GapActivityEvaluation) => {
    if (!user?.id || !assessment) return

    const draft = drafts[evaluation.id]
    if (!draft) return

    setSavingEvaluationId(evaluation.id)
    setError(null)

    try {
      const updatedEvaluation = await updateGapActivityEvaluation(evaluation.id, user.id, {
        current_state: toNullable(draft.current_state),
        target_state_override: toNullable(draft.target_state_override),
        gap_description: toNullable(draft.gap_description),
        compliance_status: draft.compliance_status,
        risk_priority: draft.risk_priority,
        notes: toNullable(draft.notes),
        evaluated_by: user.email || null,
        evaluated_at: new Date().toISOString(),
      })

      const nextEvaluations = evaluations.map((item) =>
        item.id === updatedEvaluation.id ? updatedEvaluation : item,
      )
      const nextStats = aggregateAssessmentStats(nextEvaluations)

      setEvaluations(nextEvaluations)
      setDrafts((current) => ({
        ...current,
        [updatedEvaluation.id]: toEvaluationDraft(updatedEvaluation),
      }))

      try {
        const updatedAssessment = await updateGapAssessmentStats(
          assessment.id,
          user.id,
          nextStats,
        )
        setAssessment(updatedAssessment)
      } catch (statsError) {
        console.error('Errore aggiornamento indicatori assessment Gap:', statsError)
        setError(
          'Valutazione salvata, ma gli indicatori dell assessment non sono stati aggiornati. Ricarica la pagina o riprova il salvataggio.',
        )
      }
    } catch (saveError) {
      console.error('Errore salvataggio evaluation Gap:', saveError)
      setError('Impossibile salvare la valutazione. Verifica i dati e riprova.')
    } finally {
      setSavingEvaluationId(null)
    }
  }

  if (loading) {
    return (
      <div className="clinical-page">
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            Caricamento assessment Gap...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="clinical-page">
        <PageHeader
          title="Assessment Gap non trovato"
          description="L assessment richiesto non esiste oppure non e accessibile con l utente corrente."
          eyebrow="Gap Analysis"
          icon={<ClipboardList className="h-6 w-6" />}
          backAction={(
            <Link to="/gap/assessments" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800">
              <ArrowLeft className="h-4 w-4" />
              Torna agli assessment
            </Link>
          )}
        />
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Assessment non disponibile"
          description="Controlla la lista degli assessment Gap e riprova."
        />
      </div>
    )
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title={assessment.title}
        description={assessment.description || 'Valuta conformita, gap e priorita per ogni Attivita/Requisito selezionato.'}
        eyebrow="Gap Analysis"
        icon={<ClipboardList className="h-6 w-6" />}
        backAction={(
          <Link to="/gap/assessments" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800">
            <ArrowLeft className="h-4 w-4" />
            Torna agli assessment
          </Link>
        )}
        actions={(
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${getGapAssessmentStatusColor(assessment.status)}`}>
            {getGapAssessmentStatusLabel(assessment.status)}
          </span>
        )}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Struttura</p>
              <p className="mt-1 font-medium text-slate-800">{assessment.facility_name || 'N/D'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reparto / Unita</p>
              <p className="mt-1 font-medium text-slate-800">{assessment.department || 'N/D'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assessor</p>
              <p className="mt-1 font-medium text-slate-800">{assessment.assessor || 'N/D'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Data assessment</p>
              <p className="mt-1 font-medium text-slate-800">{formatDate(assessment.assessment_date)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Attivita/Requisiti"
          value={stats.total_activities}
          icon={<FileText className="h-6 w-6" />}
          tone="clinical"
        />
        <StatCard
          label="Compliance"
          value={`${stats.compliance_percentage}%`}
          icon={<Percent className="h-6 w-6" />}
          tone="success"
        />
        <StatCard
          label="Conformi"
          value={stats.compliant_count}
          icon={<CheckCircle2 className="h-6 w-6" />}
          tone="success"
        />
        <StatCard
          label="Parziali"
          value={stats.partial_count}
          icon={<CircleDashed className="h-6 w-6" />}
          tone="neutral"
        />
        <StatCard
          label="Non conformi"
          value={stats.non_compliant_count}
          icon={<AlertTriangle className="h-6 w-6" />}
          tone="risk"
        />
        <StatCard
          label="Non valutate / N.A."
          value={`${stats.not_evaluated_count}/${stats.na_count}`}
          icon={<ClipboardList className="h-6 w-6" />}
          tone="neutral"
        />
      </div>

      {evaluations.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="Nessuna valutazione disponibile"
          description="Questo assessment non contiene ancora Attivita/Requisiti da valutare."
        />
      ) : (
        <div className="space-y-6">
          {groupedEvaluations.map((processGroup) => (
            <Card key={processGroup.processName}>
              <CardHeader>
                <CardTitle>{processGroup.processName}</CardTitle>
                <CardDescription>
                  Valutazioni organizzate per Dominio/Sezione e Attivita/Requisito.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {processGroup.areas.map((areaGroup) => (
                  <section key={`${processGroup.processName}-${areaGroup.areaName}`} className="space-y-4">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        {areaGroup.areaName}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {areaGroup.evaluations.length} Attivita/Requisiti
                      </span>
                    </div>

                    <div className="grid gap-4">
                      {areaGroup.evaluations.map((evaluation) => {
                        const draft = drafts[evaluation.id]
                        const changed = hasDraftChanges(evaluation, draft)
                        const saving = savingEvaluationId === evaluation.id

                        return (
                          <div
                            key={evaluation.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                          >
                            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {evaluation.activity_code_snapshot || 'Senza codice'}
                                  </span>
                                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getComplianceStatusColor(evaluation.compliance_status)}`}>
                                    {getComplianceStatusLabel(evaluation.compliance_status)}
                                  </span>
                                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getGapRiskPriorityColor(evaluation.risk_priority)}`}>
                                    Priorita {getGapRiskPriorityLabel(evaluation.risk_priority)}
                                  </span>
                                </div>
                                <h3 className="mt-3 text-base font-semibold text-slate-950">
                                  {evaluation.activity_name_snapshot || 'Attivita/Requisito senza nome'}
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">
                                  Snapshot libreria non modificabile in assessment.
                                </p>
                              </div>

                              {evaluation.evaluated_at && (
                                <div className="text-xs text-slate-400 lg:text-right">
                                  <p>Ultima valutazione</p>
                                  <p className="font-medium text-slate-600">
                                    {new Date(evaluation.evaluated_at).toLocaleString('it-IT')}
                                  </p>
                                </div>
                              )}
                            </div>

                            {draft && (
                              <div className="grid gap-4">
                                <div className="grid gap-4 lg:grid-cols-2">
                                  <label className="block">
                                    <span className="mb-1 block text-sm font-medium text-slate-700">
                                      Stato attuale
                                    </span>
                                    <textarea
                                      value={draft.current_state}
                                      onChange={(event) => updateDraft(evaluation.id, { current_state: event.target.value })}
                                      className="clinical-input min-h-24 resize-y"
                                      placeholder="Descrivi la situazione osservata durante la valutazione."
                                    />
                                  </label>

                                  <label className="block">
                                    <span className="mb-1 block text-sm font-medium text-slate-700">
                                      Target specifico assessment
                                    </span>
                                    <textarea
                                      value={draft.target_state_override}
                                      onChange={(event) => updateDraft(evaluation.id, { target_state_override: event.target.value })}
                                      className="clinical-input min-h-24 resize-y"
                                      placeholder="Eventuale target adattato al contesto dell assessment."
                                    />
                                  </label>
                                </div>

                                <label className="block">
                                  <span className="mb-1 block text-sm font-medium text-slate-700">
                                    Gap rilevato
                                  </span>
                                  <textarea
                                    value={draft.gap_description}
                                    onChange={(event) => updateDraft(evaluation.id, { gap_description: event.target.value })}
                                    className="clinical-input min-h-24 resize-y"
                                    placeholder="Descrivi lo scostamento tra stato attuale e target."
                                  />
                                </label>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <label className="block">
                                    <span className="mb-1 block text-sm font-medium text-slate-700">
                                      Stato conformita
                                    </span>
                                    <select
                                      value={draft.compliance_status}
                                      onChange={(event) => updateDraft(evaluation.id, {
                                        compliance_status: event.target.value as ComplianceStatus,
                                      })}
                                      className="clinical-input"
                                    >
                                      {COMPLIANCE_STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>

                                  <label className="block">
                                    <span className="mb-1 block text-sm font-medium text-slate-700">
                                      Priorita rischio
                                    </span>
                                    <select
                                      value={draft.risk_priority}
                                      onChange={(event) => updateDraft(evaluation.id, {
                                        risk_priority: event.target.value as RiskPriority,
                                      })}
                                      className="clinical-input"
                                    >
                                      {RISK_PRIORITY_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>

                                <label className="block">
                                  <span className="mb-1 block text-sm font-medium text-slate-700">Note</span>
                                  <textarea
                                    value={draft.notes}
                                    onChange={(event) => updateDraft(evaluation.id, { notes: event.target.value })}
                                    className="clinical-input min-h-20 resize-y"
                                    placeholder="Evidenze, riferimenti o note operative."
                                  />
                                </label>

                                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                  {changed && (
                                    <button
                                      type="button"
                                      onClick={() => resetDraft(evaluation)}
                                      className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                      Annulla modifiche
                                    </button>
                                  )}
                                  <Button
                                    type="button"
                                    tone="success"
                                    icon={<Save className="h-4 w-4" />}
                                    loading={saving}
                                    disabled={!changed || savingEvaluationId !== null}
                                    onClick={() => saveEvaluation(evaluation)}
                                  >
                                    Salva valutazione
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
