import * as XLSX from 'xlsx'
import type {
  GapAction,
  GapActivityEvaluation,
  GapActivityStandard,
  GapAssessment,
} from '../types/gap'
import {
  GAP_ACTION_PHASE_OPTIONS,
  getComplianceStatusLabel,
  getGapActionPriorityLabel,
  getGapActionStatusLabel,
  getGapAssessmentStatusLabel,
  getGapRiskPriorityLabel,
  getGapVerificationResultLabel,
} from '../lib/labels'

type StandardsByActivityId = Record<string, GapActivityStandard[]>
type TargetStateByActivityId = Record<string, string | null>

interface GapExcelExportData {
  assessment: GapAssessment
  evaluations: GapActivityEvaluation[]
  actions: GapAction[]
  standardsByActivityId: StandardsByActivityId
  targetStateByActivityId: TargetStateByActivityId
}

const safeValue = (value: string | number | boolean | null | undefined) => {
  if (value === null || value === undefined || value === '') return 'N/D'
  return String(value)
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'N/D'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/D' : date.toLocaleDateString('it-IT')
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'N/D'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/D' : date.toLocaleString('it-IT')
}

const sanitizeFileName = (value: string) => {
  const sanitized = value
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  return sanitized.slice(0, 80) || 'Assessment_Gap'
}

const createFileName = (assessment: GapAssessment) => {
  const date = assessment.assessment_date || new Date().toISOString().split('T')[0]
  return `Gap_${sanitizeFileName(assessment.title)}_${date}.xlsx`
}

const getPhaseLabel = (phase: string | null | undefined) => {
  if (!phase) return 'N/D'
  return GAP_ACTION_PHASE_OPTIONS.find((option) => option.value === phase)?.label || phase
}

const appendSheet = (workbook: XLSX.WorkBook, name: string, rows: unknown[][], widths: number[]) => {
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet['!cols'] = widths.map((wch) => ({ wch }))
  XLSX.utils.book_append_sheet(workbook, sheet, name)
}

export const exportGapAssessmentToExcel = ({
  assessment,
  evaluations,
  actions,
  standardsByActivityId,
  targetStateByActivityId,
}: GapExcelExportData) => {
  const workbook = XLSX.utils.book_new()
  const actionsByEvaluationId = actions.reduce<Record<string, GapAction[]>>((acc, action) => ({
    ...acc,
    [action.evaluation_id]: [...(acc[action.evaluation_id] || []), action],
  }), {})

  const evaluationsByActivityId = evaluations.reduce<Record<string, GapActivityEvaluation>>((acc, evaluation) => ({
    ...acc,
    [evaluation.activity_id]: evaluation,
  }), {})

  const gapFindings = evaluations.filter((evaluation) => (
    evaluation.compliance_status === 'non_compliant' ||
    evaluation.compliance_status === 'partially_compliant'
  ))

  appendSheet(workbook, 'Riepilogo', [
    ['Campo', 'Valore'],
    ['Titolo', assessment.title],
    ['Descrizione', safeValue(assessment.description)],
    ['Struttura', safeValue(assessment.facility_name)],
    ['Reparto / Unita', safeValue(assessment.department)],
    ['Assessor', safeValue(assessment.assessor)],
    ['Data assessment', formatDate(assessment.assessment_date)],
    ['Stato', getGapAssessmentStatusLabel(assessment.status)],
    ['Data export', formatDateTime(new Date().toISOString())],
    [],
    ['Indicatore', 'Valore'],
    ['Attivita/Requisiti totali', evaluations.length || assessment.total_activities],
    ['Conformi', assessment.compliant_count],
    ['Parzialmente conformi', assessment.partial_count],
    ['Non conformi', assessment.non_compliant_count],
    ['Non valutate', assessment.not_evaluated_count],
    ['Non applicabili', assessment.na_count],
    ['Compliance %', `${assessment.compliance_percentage || 0}%`],
    ['Azioni correttive', actions.length],
    ['Gap findings', gapFindings.length],
  ], [28, 70])

  appendSheet(workbook, 'Valutazioni', [
    [
      'Processo',
      'Dominio/Sezione',
      'Codice Attivita/Requisito',
      'Attivita/Requisito',
      'Target atteso di riferimento',
      'Stato attuale',
      'Gap rilevato rispetto al target',
      'Conformita',
      'Priorita rischio',
      'Note',
      'Valutato da',
      'Data valutazione',
      'Azioni collegate',
      'Norme collegate',
    ],
    ...evaluations.map((evaluation) => {
      const linkedStandards = standardsByActivityId[evaluation.activity_id] || []
      return [
        safeValue(evaluation.process_name_snapshot),
        safeValue(evaluation.area_name_snapshot),
        safeValue(evaluation.activity_code_snapshot),
        safeValue(evaluation.activity_name_snapshot),
        safeValue(targetStateByActivityId[evaluation.activity_id]),
        safeValue(evaluation.current_state),
        safeValue(evaluation.gap_description),
        getComplianceStatusLabel(evaluation.compliance_status),
        getGapRiskPriorityLabel(evaluation.risk_priority),
        safeValue(evaluation.notes),
        safeValue(evaluation.evaluated_by),
        formatDateTime(evaluation.evaluated_at),
        actionsByEvaluationId[evaluation.id]?.length || 0,
        linkedStandards.length,
      ]
    }),
  ], [26, 26, 18, 34, 45, 45, 45, 24, 18, 38, 20, 22, 16, 16])

  appendSheet(workbook, 'Gap Findings', [
    [
      'Processo',
      'Dominio/Sezione',
      'Codice Attivita/Requisito',
      'Attivita/Requisito',
      'Target atteso di riferimento',
      'Stato attuale',
      'Gap rilevato rispetto al target',
      'Conformita',
      'Priorita rischio',
      'Note',
      'Azioni collegate',
    ],
    ...gapFindings.map((evaluation) => [
      safeValue(evaluation.process_name_snapshot),
      safeValue(evaluation.area_name_snapshot),
      safeValue(evaluation.activity_code_snapshot),
      safeValue(evaluation.activity_name_snapshot),
      safeValue(targetStateByActivityId[evaluation.activity_id]),
      safeValue(evaluation.current_state),
      safeValue(evaluation.gap_description),
      getComplianceStatusLabel(evaluation.compliance_status),
      getGapRiskPriorityLabel(evaluation.risk_priority),
      safeValue(evaluation.notes),
      actionsByEvaluationId[evaluation.id]?.length || 0,
    ]),
  ], [26, 26, 18, 34, 45, 45, 45, 24, 18, 38, 16])

  appendSheet(workbook, 'Azioni', [
    [
      'Descrizione',
      'Processo',
      'Dominio/Sezione',
      'Codice Attivita/Requisito',
      'Attivita/Requisito',
      'Responsabile/i',
      'Priorita',
      'Stato',
      'Avanzamento %',
      'Fase',
      'Inizio pianificato',
      'Fine pianificata',
      'Inizio effettivo',
      'Fine effettiva',
      'Scadenza verifica',
      'Esito verifica',
      'Verificato il',
      'Verificato da',
      'Metodo verifica',
      'Note verifica',
      'Note',
    ],
    ...actions.map((action) => {
      const evaluation = evaluations.find((item) => item.id === action.evaluation_id)
      return [
        safeValue(action.description),
        safeValue(evaluation?.process_name_snapshot),
        safeValue(evaluation?.area_name_snapshot),
        safeValue(evaluation?.activity_code_snapshot),
        safeValue(evaluation?.activity_name_snapshot),
        safeValue(action.responsible),
        getGapActionPriorityLabel(action.priority),
        getGapActionStatusLabel(action.status),
        action.progress ?? 0,
        getPhaseLabel(action.phase),
        formatDate(action.planned_start_date),
        formatDate(action.planned_end_date),
        formatDate(action.actual_start_date),
        formatDate(action.actual_end_date),
        formatDate(action.verification_due_date),
        getGapVerificationResultLabel(action.verification_result),
        formatDateTime(action.verified_at),
        safeValue(action.verified_by),
        safeValue(action.verification_method),
        safeValue(action.verification_notes),
        safeValue(action.notes),
      ]
    }),
  ], [45, 24, 24, 18, 32, 24, 16, 18, 14, 18, 18, 18, 18, 18, 18, 22, 20, 20, 28, 36, 36])

  const standardsRows = Object.entries(standardsByActivityId).flatMap(([activityId, links]) => {
    const evaluation = evaluationsByActivityId[activityId]
    return links.map((link) => [
      safeValue(evaluation?.process_name_snapshot),
      safeValue(evaluation?.area_name_snapshot),
      safeValue(evaluation?.activity_code_snapshot),
      safeValue(evaluation?.activity_name_snapshot),
      safeValue(link.standard?.code),
      safeValue(link.standard?.name),
      safeValue(link.standard?.version),
      safeValue(link.standard?.issuing_body),
      safeValue(link.specific_reference),
      safeValue(link.standard?.url),
    ])
  })

  appendSheet(workbook, 'Norme', [
    [
      'Processo',
      'Dominio/Sezione',
      'Codice Attivita/Requisito',
      'Attivita/Requisito',
      'Codice norma',
      'Nome norma',
      'Versione',
      'Ente emittente',
      'Riferimento specifico',
      'URL',
    ],
    ...standardsRows,
  ], [26, 26, 18, 34, 18, 34, 16, 24, 34, 40])

  XLSX.writeFile(workbook, createFileName(assessment))
}
