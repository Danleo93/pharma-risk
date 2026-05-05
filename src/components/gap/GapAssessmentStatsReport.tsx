import type { ReactNode, RefObject } from 'react'
import { BarChart3, CheckSquare, FileText, ShieldAlert } from 'lucide-react'
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
import { GapActionGantt } from './GapActionGantt'
import { GapActionStatusChart } from './GapActionStatusChart'
import { GapComplianceByDomainChart } from './GapComplianceByDomainChart'
import { GapComplianceChart } from './GapComplianceChart'
import { GapPriorityChart } from './GapPriorityChart'

type StandardsByActivityId = Record<string, GapActivityStandard[]>
type TargetStateByActivityId = Record<string, string | null>

export interface GapReportChartRefs {
  complianceByDomain: RefObject<HTMLDivElement | null>
  complianceDistribution: RefObject<HTMLDivElement | null>
  priorityDistribution: RefObject<HTMLDivElement | null>
  actionStatus: RefObject<HTMLDivElement | null>
  verificationStatus: RefObject<HTMLDivElement | null>
  actionGantt: RefObject<HTMLDivElement | null>
}

interface GapAssessmentStatsReportProps {
  assessment: GapAssessment
  evaluations: GapActivityEvaluation[]
  actions: GapAction[]
  standardsByActivityId: StandardsByActivityId
  targetStateByActivityId: TargetStateByActivityId
  chartRefs?: GapReportChartRefs
}

const isGapFinding = (evaluation: GapActivityEvaluation) =>
  evaluation.compliance_status === 'non_compliant' ||
  evaluation.compliance_status === 'partially_compliant'

function FocusBox({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      </div>
      <div className="text-sm leading-6 text-slate-700">{children}</div>
    </div>
  )
}

export function GapAssessmentStatsReport({
  assessment,
  evaluations,
  actions,
  standardsByActivityId,
  targetStateByActivityId,
  chartRefs,
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
        description="Aggiungi Attività/Requisiti all'assessment per generare statistiche e report."
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
        <CardContent className="space-y-4">
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
              L'assessment include {evaluations.length} Attività/Requisiti valutabili.
              Sono presenti {gapFindings.length} gap aperti, di cui {highPriorityGaps.length} ad alta priorità.
              Il piano d'azione contiene {actions.length} azioni correttive, con {openActions.length} ancora aperte.
            </p>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 text-sm leading-6 text-sky-800">
            Per esportare il report usa i pulsanti PDF/Excel in alto nella pagina.
            Riferimenti normativi collegati: {linkedStandardsCount}. Attività/Requisiti con target atteso di riferimento disponibile: {activitiesWithTarget}.
            {overdueActions.length > 0 && ` Azioni scadute da monitorare: ${overdueActions.length}.`}
            {pendingVerifications.length > 0 && ` Verifiche pending: ${pendingVerifications.length}.`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Note metodologiche dell'analisi</CardTitle>
          <CardDescription>
            Criteri interpretativi per leggere lo scostamento tra stato attuale e target atteso.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <FocusBox icon={<FileText className="h-4 w-4" />} title="Perimetro">
            La Gap Analysis confronta lo stato corrente delle Attività/Requisiti con il target atteso di riferimento
            definito nella libreria del processo. Le valutazioni sono riferite allo specifico assessment e non modificano
            il target di libreria.
          </FocusBox>
          <FocusBox icon={<BarChart3 className="h-4 w-4" />} title="Criteri di conformità">
            La compliance considera conformi, parzialmente conformi e non conformi solo le valutazioni effettivamente
            compilate. Le voci non valutate o non applicabili sono escluse dal calcolo percentuale.
          </FocusBox>
          <FocusBox icon={<CheckSquare className="h-4 w-4" />} title="Azioni e verifica">
            I gap non conformi o parziali alimentano il piano d'azione. La verifica di efficacia documenta se
            l'intervento ha chiuso lo scostamento, lo ha ridotto parzialmente o richiede una nuova azione.
          </FocusBox>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance della valutazione</CardTitle>
          <CardDescription>
            Sintesi del livello di conformità generale e distribuzione per Dominio/Sezione.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <FocusBox icon={<BarChart3 className="h-4 w-4" />} title="Lettura compliance">
            I grafici descrivono quanto l'assessment si avvicina al target atteso di riferimento.
            Le valutazioni non applicabili o non ancora valutate aiutano a distinguere scostamenti reali da attività non ancora auditabili.
          </FocusBox>
          <div className="grid gap-6 xl:grid-cols-2">
            <GapComplianceByDomainChart evaluations={evaluations} captureRef={chartRefs?.complianceByDomain} />
            <GapComplianceChart evaluations={evaluations} captureRef={chartRefs?.complianceDistribution} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Priorità dei gap</CardTitle>
          <CardDescription>
            Lettura della criticità dei gap non conformi o parzialmente conformi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <FocusBox icon={<ShieldAlert className="h-4 w-4" />} title="Lettura priorità">
            I gap ad alta priorità richiedono pianificazione correttiva tempestiva e monitoraggio delle scadenze.
            Le priorità medie e basse orientano invece il miglioramento progressivo del processo.
          </FocusBox>
          <div className="grid gap-6 xl:grid-cols-2">
            <GapPriorityChart evaluations={evaluations} captureRef={chartRefs?.priorityDistribution} />
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-950">Focus gap prioritari</p>
              {highPriorityGaps.length === 0 ? (
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Nessun gap ad alta priorità rilevato nello specifico assessment.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {highPriorityGaps.slice(0, 5).map((evaluation) => (
                    <div key={evaluation.id} className="rounded-lg border border-red-100 bg-red-50/60 p-3 text-sm">
                      <p className="font-semibold text-red-800">
                        {evaluation.activity_code_snapshot || 'Senza codice'} - {evaluation.activity_name_snapshot || 'Attività/Requisito'}
                      </p>
                      <p className="mt-1 line-clamp-2 text-red-700">
                        {evaluation.gap_description || 'Gap non descritto.'}
                      </p>
                    </div>
                  ))}
                  {highPriorityGaps.length > 5 && (
                    <p className="text-xs font-medium text-slate-500">
                      +{highPriorityGaps.length - 5} altri gap ad alta priorità.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Azioni correttive</CardTitle>
          <CardDescription>
            Stato operativo, verifica di efficacia e pianificazione temporale del piano azioni.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <FocusBox icon={<CheckSquare className="h-4 w-4" />} title="Lettura piano azioni">
            Le azioni correttive traducono i gap rilevati in interventi assegnati e pianificati.
            Il Diagramma di GANTT consente di verificare sequenza temporale, scadenze e milestone di verifica efficacia.
          </FocusBox>
          <div className="grid gap-6 xl:grid-cols-2">
            <GapActionStatusChart actions={actions} mode="status" captureRef={chartRefs?.actionStatus} />
            <GapActionStatusChart actions={actions} mode="verification" captureRef={chartRefs?.verificationStatus} />
          </div>
          <GapActionGantt actions={actions} evaluations={gapFindings} captureRef={chartRefs?.actionGantt} />
        </CardContent>
      </Card>
    </div>
  )
}

