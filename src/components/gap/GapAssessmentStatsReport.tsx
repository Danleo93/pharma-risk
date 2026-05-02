import { FileText } from 'lucide-react'
import { isGapActionOverdue } from '../../lib/gapScoring'
import {
  getGapAssessmentStatusColor,
  getGapAssessmentStatusLabel,
} from '../../lib/labels'
import type {
  GapAction,
  GapActivityEvaluation,
  GapActivityStandard,
  GapAssessment,
} from '../../types/gap'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { GapActionStatusChart } from './GapActionStatusChart'
import { GapComplianceByDomainChart } from './GapComplianceByDomainChart'
import { GapComplianceChart } from './GapComplianceChart'
import { GapPriorityChart } from './GapPriorityChart'

type StandardsByActivityId = Record<string, GapActivityStandard[]>
type TargetStateByActivityId = Record<string, string | null>

interface GapAssessmentStatsReportProps {
  assessment: GapAssessment
  evaluations: GapActivityEvaluation[]
  actions: GapAction[]
  standardsByActivityId: StandardsByActivityId
  targetStateByActivityId: TargetStateByActivityId
}

const isGapFinding = (evaluation: GapActivityEvaluation) =>
  evaluation.compliance_status === 'non_compliant' ||
  evaluation.compliance_status === 'partially_compliant'

export function GapAssessmentStatsReport({
  assessment,
  evaluations,
  actions,
  standardsByActivityId,
  targetStateByActivityId,
}: GapAssessmentStatsReportProps) {
  const gapFindings = evaluations.filter(isGapFinding)
  const highPriorityGaps = gapFindings.filter((evaluation) => evaluation.risk_priority === 'high')
  const openActions = actions.filter((action) => !['completed', 'verified', 'closed'].includes(action.status))
  const overdueActions = actions.filter((action) => isGapActionOverdue(action))
  const pendingVerifications = actions.filter((action) =>
    action.status === 'completed' && action.verification_result === 'pending',
  )
  const linkedStandardsCount = Object.values(standardsByActivityId).reduce((total, links) => total + links.length, 0)
  const activitiesWithTarget = evaluations.filter((evaluation) =>
    Boolean(targetStateByActivityId[evaluation.activity_id]),
  ).length

  if (evaluations.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title="Statistiche non disponibili"
        description="Aggiungi Attivita/Requisiti all'assessment per generare statistiche e report."
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analisi assessment</CardTitle>
          <CardDescription>Vista analitica leggera dello specifico assessment Gap.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getGapAssessmentStatusColor(assessment.status)}`}>
                {getGapAssessmentStatusLabel(assessment.status)}
              </span>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
                {assessment.compliance_percentage || 0}% compliance
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                {gapFindings.length} gap aperti
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              L'assessment include {evaluations.length} Attivita/Requisiti valutabili.
              Sono presenti {gapFindings.length} gap aperti, di cui {highPriorityGaps.length} ad alta priorita.
              Il piano d'azione contiene {actions.length} azioni correttive, con {openActions.length} ancora aperte.
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-950">Grafici principali</h2>
      <div className="grid gap-6 xl:grid-cols-2">
        <GapComplianceByDomainChart evaluations={evaluations} />
        <GapComplianceChart evaluations={evaluations} />
        <GapPriorityChart evaluations={evaluations} />
        <GapActionStatusChart actions={actions} mode="status" />
        <GapActionStatusChart actions={actions} mode="verification" />
      </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sintesi report</CardTitle>
          <CardDescription>Elementi interpretativi utili alla lettura del report documentale.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Focus valutazione</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Le valutazioni documentano stato attuale, target di riferimento, gap, conformita e priorita.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Focus azioni</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Le azioni correttive restano collegate ai gap non conformi o parzialmente conformi.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Focus audit</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Norme e target derivano dalla libreria e rendono il report riutilizzabile per audit futuri.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 text-sm leading-6 text-sky-800">
            Per esportare il report usa i pulsanti PDF/Excel in alto nella pagina.
            Riferimenti normativi collegati: {linkedStandardsCount}. Attivita/Requisiti con target atteso di riferimento disponibile: {activitiesWithTarget}.
            {overdueActions.length > 0 && ` Azioni scadute da monitorare: ${overdueActions.length}.`}
            {pendingVerifications.length > 0 && ` Verifiche pending: ${pendingVerifications.length}.`}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
