import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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

interface GapAssessmentExportData {
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

const createFileName = (assessment: GapAssessment, extension: 'pdf' | 'xlsx') => {
  const date = assessment.assessment_date || new Date().toISOString().split('T')[0]
  return `Gap_${sanitizeFileName(assessment.title)}_${date}.${extension}`
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

const getLastAutoTableY = (doc: jsPDF, fallback: number) => {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || fallback
}

const addPageIfNeeded = (doc: jsPDF, y: number, neededSpace = 35) => {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + neededSpace <= pageHeight - 14) return y
  doc.addPage()
  return 18
}

const addSectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(title, 14, y)
  return y + 7
}

const gapFindingsFromEvaluations = (evaluations: GapActivityEvaluation[]) => (
  evaluations.filter((evaluation) => (
    evaluation.compliance_status === 'non_compliant' ||
    evaluation.compliance_status === 'partially_compliant'
  ))
)

export const exportGapAssessmentToExcel = ({
  assessment,
  evaluations,
  actions,
  standardsByActivityId,
  targetStateByActivityId,
}: GapAssessmentExportData) => {
  const workbook = XLSX.utils.book_new()
  const actionsByEvaluationId = actions.reduce<Record<string, GapAction[]>>((acc, action) => ({
    ...acc,
    [action.evaluation_id]: [...(acc[action.evaluation_id] || []), action],
  }), {})

  const evaluationsByActivityId = evaluations.reduce<Record<string, GapActivityEvaluation>>((acc, evaluation) => ({
    ...acc,
    [evaluation.activity_id]: evaluation,
  }), {})

  const gapFindings = gapFindingsFromEvaluations(evaluations)

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

  XLSX.writeFile(workbook, createFileName(assessment, 'xlsx'))
}

export const exportGapAssessmentToPDF = ({
  assessment,
  evaluations,
  actions,
  standardsByActivityId,
  targetStateByActivityId,
}: GapAssessmentExportData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  const gapFindings = gapFindingsFromEvaluations(evaluations)
  const actionsByEvaluationId = actions.reduce<Record<string, GapAction[]>>((acc, action) => ({
    ...acc,
    [action.evaluation_id]: [...(acc[action.evaluation_id] || []), action],
  }), {})
  const evaluationsByActivityId = evaluations.reduce<Record<string, GapActivityEvaluation>>((acc, evaluation) => ({
    ...acc,
    [evaluation.activity_id]: evaluation,
  }), {})

  doc.setFillColor(15, 118, 110)
  doc.rect(0, 0, pageWidth, 36, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(21)
  doc.text('PhaRMA T - GAP ANALYSIS REPORT', pageWidth / 2, 22, { align: 'center' })

  let y = 52
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(17)
  doc.text(assessment.title, pageWidth / 2, y, { align: 'center', maxWidth: contentWidth })

  y += 10
  if (assessment.description) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(doc.splitTextToSize(assessment.description, contentWidth - 12), pageWidth / 2, y, { align: 'center' })
    y += Math.min(24, doc.splitTextToSize(assessment.description, contentWidth - 12).length * 5) + 5
  }

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Campo', 'Valore']],
    body: [
      ['Struttura', safeValue(assessment.facility_name)],
      ['Reparto / Unita', safeValue(assessment.department)],
      ['Assessor', safeValue(assessment.assessor)],
      ['Data assessment', formatDate(assessment.assessment_date)],
      ['Stato', getGapAssessmentStatusLabel(assessment.status)],
      ['Data export', formatDateTime(new Date().toISOString())],
    ],
    styles: { fontSize: 9, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: contentWidth - 45 },
    },
    margin: { left: margin, right: margin },
  })

  y = getLastAutoTableY(doc, y) + 12
  y = addPageIfNeeded(doc, y, 55)
  y = addSectionTitle(doc, 'Riepilogo KPI', y)
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Indicatore', 'Valore']],
    body: [
      ['Attivita/Requisiti totali', String(evaluations.length || assessment.total_activities)],
      ['Compliance', `${assessment.compliance_percentage || 0}%`],
      ['Conformi', String(assessment.compliant_count)],
      ['Parzialmente conformi', String(assessment.partial_count)],
      ['Non conformi', String(assessment.non_compliant_count)],
      ['Non valutate', String(assessment.not_evaluated_count)],
      ['N.A.', String(assessment.na_count)],
      ['Gap findings', String(gapFindings.length)],
      ['Azioni correttive', String(actions.length)],
    ],
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [20, 184, 166], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  })

  y = getLastAutoTableY(doc, y) + 12
  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, 'Valutazioni', y)
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['Processo', 'Dominio/Sezione', 'Codice', 'Attivita/Requisito', 'Target atteso', 'Stato attuale', 'Gap', 'Conformita', 'Priorita']],
    body: evaluations.map((evaluation) => [
      safeValue(evaluation.process_name_snapshot),
      safeValue(evaluation.area_name_snapshot),
      safeValue(evaluation.activity_code_snapshot),
      safeValue(evaluation.activity_name_snapshot),
      safeValue(targetStateByActivityId[evaluation.activity_id]),
      safeValue(evaluation.current_state),
      safeValue(evaluation.gap_description),
      getComplianceStatusLabel(evaluation.compliance_status),
      getGapRiskPriorityLabel(evaluation.risk_priority),
    ]),
    styles: { fontSize: 7, cellPadding: 1.6, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20 },
      2: { cellWidth: 18 },
      3: { cellWidth: 24 },
      4: { cellWidth: 29 },
      5: { cellWidth: 27 },
      6: { cellWidth: 27 },
      7: { cellWidth: 20 },
      8: { cellWidth: 14 },
    },
    margin: { left: margin, right: margin },
  })

  y = getLastAutoTableY(doc, y) + 12
  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, 'Gap Findings', y)
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Codice', 'Attivita/Requisito', 'Dominio/Sezione', 'Target atteso', 'Gap rilevato', 'Conformita', 'Priorita', 'Azioni']],
    body: gapFindings.length > 0
      ? gapFindings.map((evaluation) => [
          safeValue(evaluation.activity_code_snapshot),
          safeValue(evaluation.activity_name_snapshot),
          safeValue(evaluation.area_name_snapshot),
          safeValue(targetStateByActivityId[evaluation.activity_id]),
          safeValue(evaluation.gap_description),
          getComplianceStatusLabel(evaluation.compliance_status),
          getGapRiskPriorityLabel(evaluation.risk_priority),
          String(actionsByEvaluationId[evaluation.id]?.length || 0),
        ])
      : [['N/D', 'Nessun gap finding presente', 'N/D', 'N/D', 'N/D', 'N/D', 'N/D', '0']],
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [220, 38, 38], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 30 },
      2: { cellWidth: 24 },
      3: { cellWidth: 34 },
      4: { cellWidth: 38 },
      5: { cellWidth: 24 },
      6: { cellWidth: 18 },
      7: { cellWidth: 12, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  })

  y = getLastAutoTableY(doc, y) + 12
  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, 'Azioni correttive', y)
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Descrizione', 'Attivita/Requisito', 'Responsabile/i', 'Priorita', 'Stato', 'Progress', 'Fase', 'Date', 'Verifica']],
    body: actions.length > 0
      ? actions.map((action) => {
          const evaluation = evaluations.find((item) => item.id === action.evaluation_id)
          return [
            safeValue(action.description),
            `${safeValue(evaluation?.activity_code_snapshot)} - ${safeValue(evaluation?.activity_name_snapshot)}`,
            safeValue(action.responsible),
            getGapActionPriorityLabel(action.priority),
            getGapActionStatusLabel(action.status),
            `${action.progress ?? 0}%`,
            getPhaseLabel(action.phase),
            `Inizio: ${formatDate(action.planned_start_date)}\nFine: ${formatDate(action.planned_end_date)}`,
            `${getGapVerificationResultLabel(action.verification_result)}\nScadenza: ${formatDate(action.verification_due_date)}`,
          ]
        })
      : [['Nessuna azione correttiva presente', 'N/D', 'N/D', 'N/D', 'N/D', '0%', 'N/D', 'N/D', 'N/D']],
    styles: { fontSize: 7.5, cellPadding: 1.8, overflow: 'linebreak' },
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 37 },
      1: { cellWidth: 31 },
      2: { cellWidth: 22 },
      3: { cellWidth: 16 },
      4: { cellWidth: 18 },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 18 },
      7: { cellWidth: 23 },
      8: { cellWidth: 23 },
    },
    margin: { left: margin, right: margin },
  })

  const standardsRows = Object.entries(standardsByActivityId).flatMap(([activityId, links]) => {
    const evaluation = evaluationsByActivityId[activityId]
    return links.map((link) => [
      safeValue(evaluation?.activity_code_snapshot),
      safeValue(evaluation?.activity_name_snapshot),
      safeValue(evaluation?.area_name_snapshot),
      safeValue(link.standard?.code),
      safeValue(link.standard?.name),
      safeValue(link.standard?.version),
      safeValue(link.standard?.issuing_body),
      safeValue(link.specific_reference),
      safeValue(link.standard?.url),
    ])
  })

  y = getLastAutoTableY(doc, y) + 12
  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, 'Riferimenti normativi', y)
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['Codice attivita', 'Attivita/Requisito', 'Dominio/Sezione', 'Codice norma', 'Norma', 'Versione', 'Ente', 'Riferimento', 'URL']],
    body: standardsRows.length > 0
      ? standardsRows
      : [['N/D', 'Nessun riferimento normativo collegato', 'N/D', 'N/D', 'N/D', 'N/D', 'N/D', 'N/D', 'N/D']],
    styles: { fontSize: 7.5, cellPadding: 1.8, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 30 },
      2: { cellWidth: 23 },
      3: { cellWidth: 18 },
      4: { cellWidth: 30 },
      5: { cellWidth: 15 },
      6: { cellWidth: 20 },
      7: { cellWidth: 28 },
      8: { cellWidth: 20 },
    },
    margin: { left: margin, right: margin },
  })

  doc.save(createFileName(assessment, 'pdf'))
}
