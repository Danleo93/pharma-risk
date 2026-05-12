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
import { isGapFinding } from '../lib/gapScoring'

type StandardsByActivityId = Record<string, GapActivityStandard[]>
type TargetStateByActivityId = Record<string, string | null>

export interface GapAssessmentPDFChartImages {
  complianceByDomain?: string | null
  complianceDistribution?: string | null
  priorityDistribution?: string | null
  actionStatus?: string | null
  verificationStatus?: string | null
  actionGantt?: string | null
}

interface GapAssessmentExportData {
  assessment: GapAssessment
  evaluations: GapActivityEvaluation[]
  actions: GapAction[]
  standardsByActivityId: StandardsByActivityId
  targetStateByActivityId: TargetStateByActivityId
  chartImages?: GapAssessmentPDFChartImages
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

const getStandardOriginLabel = (sourceType: string | null | undefined) => (
  sourceType === 'assessment_only' ? 'Solo assessment' : 'Libreria'
)

const appendSheet = (workbook: XLSX.WorkBook, name: string, rows: unknown[][], widths: number[]) => {
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet['!cols'] = widths.map((wch) => ({ wch }))
  XLSX.utils.book_append_sheet(workbook, sheet, name)
}

const getLastAutoTableY = (doc: jsPDF, fallback: number) => {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || fallback
}

const addPageIfNeeded = (
  doc: jsPDF,
  y: number,
  neededSpace = 35,
  orientation?: 'portrait' | 'landscape',
) => {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + neededSpace <= pageHeight - 14) return y
  if (orientation) {
    doc.addPage('a4', orientation)
  } else {
    doc.addPage()
  }
  return 18
}

const addSectionTitle = (doc: jsPDF, title: string, y: number, x = 14) => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(title, x, y)
  return y + 7
}

const addEmptyNotice = (doc: jsPDF, text: string, y: number, margin = 14) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const boxWidth = pageWidth - margin * 2

  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(margin, y, boxWidth, 16, 2, 2, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(text, margin + 4, y + 10)

  return y + 24
}

const addParagraph = (doc: jsPDF, text: string, y: number, margin = 14) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const maxWidth = pageWidth - margin * 2
  const lines = doc.splitTextToSize(text, maxWidth)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(lines, margin, y)

  return y + lines.length * 5 + 4
}

const addChartImage = (
  doc: jsPDF,
  image: string | null | undefined,
  title: string,
  description: string,
  y: number,
  margin = 14,
) => {
  y = addPageIfNeeded(doc, y, 48)
  y = addSectionTitle(doc, title, y, margin)
  y = addParagraph(doc, description, y, margin)

  if (!image) {
    return addEmptyNotice(doc, 'Grafico non disponibile per questa esportazione.', y, margin)
  }

  const pageWidth = doc.internal.pageSize.getWidth()
  const maxWidth = pageWidth - margin * 2
  const maxHeight = 92
  const properties = doc.getImageProperties(image)
  const scale = Math.min(maxWidth / properties.width, maxHeight / properties.height)
  const imageWidth = properties.width * scale
  const imageHeight = properties.height * scale

  y = addPageIfNeeded(doc, y, imageHeight + 12)
  const imageX = margin + ((maxWidth - imageWidth) / 2)
  doc.addImage(image, 'PNG', imageX, y, imageWidth, imageHeight)

  return y + imageHeight + 12
}

const addLandscapeChartPage = (
  doc: jsPDF,
  image: string | null | undefined,
  title: string,
  description: string,
) => {
  if (!image) return

  doc.addPage('a4', 'landscape')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  let y = addSectionTitle(doc, title, 16, margin)
  y = addParagraph(doc, description, y, margin)

  const properties = doc.getImageProperties(image)
  const maxWidth = pageWidth - margin * 2
  const maxHeight = pageHeight - y - 14
  const scale = Math.min(maxWidth / properties.width, maxHeight / properties.height)
  const imageWidth = properties.width * scale
  const imageHeight = properties.height * scale
  const imageX = margin + ((maxWidth - imageWidth) / 2)
  const imageY = y + ((maxHeight - imageHeight) / 2)

  doc.addImage(image, 'PNG', imageX, imageY, imageWidth, imageHeight)
}

const addGapMethodologySection = (doc: jsPDF, startY: number) => {
  let y = addPageIfNeeded(doc, startY, 115)
  y = addSectionTitle(doc, 'Metodologia Gap Analysis', y)
  y = addParagraph(
    doc,
    "La Gap Analysis confronta lo stato attuale delle Attività/Requisiti con il target atteso di riferimento definito nella libreria del processo. L'obiettivo è identificare scostamenti documentabili, classificarne la priorità e trasformarli in azioni correttive monitorabili.",
    y,
  )
  y = addParagraph(
    doc,
    'Il target appartiene alla libreria dell’Attività/Requisito ed è mostrato come riferimento stabile. Lo specifico assessment raccoglie stato attuale, gap rilevato rispetto al target, conformità, priorità, note e riferimenti normativi collegati.',
    y,
  )

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Elemento', 'Interpretazione metodologica']],
    body: [
      ['Conforme', 'Lo stato attuale rispetta il target atteso di riferimento.'],
      ['Parzialmente conforme', 'Sono presenti scostamenti parziali o controlli non pienamente robusti.'],
      ['Non conforme', 'Il requisito non è soddisfatto o il gap richiede una correzione strutturata.'],
      ['Non valutata', 'Elemento non ancora analizzato; escluso dal calcolo della compliance.'],
      ['N.A.', 'Elemento non applicabile al perimetro valutato; escluso dal calcolo della compliance.'],
      ['Priorità gap', 'La priorità orienta urgenza, responsabilità e sequenza del piano d’azione.'],
      ['Verifica efficacia', 'Valuta se l’azione correttiva ha chiuso o ridotto lo scostamento rilevato.'],
    ],
    styles: { fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak', valign: 'top' },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: 136 },
    },
    margin: { left: 14, right: 14, bottom: 18 },
  })

  return getLastAutoTableY(doc, y) + 12
}

const addFinalSignaturePage = (doc: jsPDF, assessment: GapAssessment) => {
  doc.addPage('a4', 'portrait')
  const margin = 14
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = addSectionTitle(doc, 'Monitoraggio e firma finale', 22, margin)
  y = addParagraph(
    doc,
    'Questa sezione documenta la chiusura formale del report Gap Analysis e la pianificazione della rivalutazione. I campi possono essere completati dopo revisione clinico-organizzativa, audit interno o verifica di efficacia delle azioni correttive.',
    y,
    margin,
  )

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Campo', 'Valore / Note']],
    body: [
      ['Assessment', safeValue(assessment.title)],
      ['Assessor', safeValue(assessment.assessor)],
      ['Rivalutazione prevista', '____________________________________________'],
      ['Responsabile verifica', '____________________________________________'],
      ['Note conclusive', '\n\n\n'],
    ],
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak', valign: 'top' },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: pageWidth - margin * 2 - 48 },
    },
    margin: { left: margin, right: margin, bottom: 18 },
  })

  y = getLastAutoTableY(doc, y) + 24
  doc.setDrawColor(148, 163, 184)
  doc.line(margin, y, pageWidth / 2 - 12, y)
  doc.line(pageWidth / 2 + 12, y, pageWidth - margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Firma responsabile', margin + 20, y + 6)
  doc.text('Data', pageWidth / 2 + 48, y + 6)
}

const addDocumentFooter = (doc: jsPDF, title: string) => {
  const pageCount = doc.getNumberOfPages()
  const cleanTitle = safeValue(title).slice(0, 70)

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber)
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    doc.setDrawColor(226, 232, 240)
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`PhaRMA T - Gap Analysis | ${cleanTitle}`, 14, pageHeight - 5)
    doc.text(`Pagina ${pageNumber}/${pageCount}`, pageWidth - 14, pageHeight - 5, { align: 'right' })
  }
}

const gapFindingsFromEvaluations = (evaluations: GapActivityEvaluation[]) => (
  evaluations.filter(isGapFinding)
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
    ['Reparto / Unità', safeValue(assessment.department)],
    ['Assessor', safeValue(assessment.assessor)],
    ['Data assessment', formatDate(assessment.assessment_date)],
    ['Stato', getGapAssessmentStatusLabel(assessment.status)],
    ['Data export', formatDateTime(new Date().toISOString())],
    [],
    ['Indicatore', 'Valore'],
    ['Attività/Requisiti totali', evaluations.length || assessment.total_activities],
    ['Conformi', assessment.compliant_count],
    ['Parzialmente conformi', assessment.partial_count],
    ['Non conformi', assessment.non_compliant_count],
    ['Non valutate', assessment.not_evaluated_count],
    ['Non applicabili', assessment.na_count],
    ['Compliance %', `${assessment.compliance_percentage || 0}%`],
    ['Azioni correttive', actions.length],
    ['Gap rilevati', gapFindings.length],
  ], [28, 70])

  appendSheet(workbook, 'Valutazioni', [
    [
      'Processo',
      'Dominio/Sezione',
      'Codice Attività/Requisito',
      'Attività/Requisito',
      'Target atteso di riferimento',
      'Stato attuale',
      'Gap rilevato rispetto al target',
      'Conformità',
      'Priorità rischio',
      'Note',
      'Valutato da',
      'Data valutazione',
      'Azioni collegate',
      'Norme collegate',
      'Norme cogenti',
      'Ambiti norme',
    ],
    ...evaluations.map((evaluation) => {
      const linkedStandards = standardsByActivityId[evaluation.activity_id] || []
      const mandatoryStandards = linkedStandards.filter((link) => link.standard?.is_mandatory)
      const standardScopes = Array.from(new Set(
        linkedStandards
          .map((link) => link.standard?.application_scope)
          .filter((value): value is string => Boolean(value)),
      ))
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
        mandatoryStandards.length,
        standardScopes.length > 0 ? standardScopes.join(', ') : 'N/D',
      ]
    }),
  ], [26, 26, 18, 34, 45, 45, 45, 24, 18, 38, 20, 22, 16, 16, 16, 28])

  appendSheet(workbook, 'Gap rilevati', [
    [
      'Processo',
      'Dominio/Sezione',
      'Codice Attività/Requisito',
      'Attività/Requisito',
      'Target atteso di riferimento',
      'Stato attuale',
      'Gap rilevato rispetto al target',
      'Conformità',
      'Priorità rischio',
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
      'Codice Attività/Requisito',
      'Attività/Requisito',
      'Responsabile/i',
      'Priorità',
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
      link.standard?.is_mandatory ? 'Sì' : 'No',
      safeValue(link.standard?.application_scope),
      getStandardOriginLabel(link.standard?.source_type),
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
      'Codice Attività/Requisito',
      'Attività/Requisito',
      'Codice norma',
      'Nome norma',
      'Cogente',
      'Ambito di applicazione',
      'Origine',
      'Versione',
      'Ente emittente',
      'Riferimento specifico',
      'URL',
    ],
    ...standardsRows,
  ], [26, 26, 18, 34, 18, 34, 14, 28, 18, 16, 24, 34, 40])

  XLSX.writeFile(workbook, createFileName(assessment, 'xlsx'))
}

export const exportGapAssessmentToPDF = ({
  assessment,
  evaluations,
  actions,
  standardsByActivityId,
  targetStateByActivityId,
  chartImages,
}: GapAssessmentExportData) => {
  const doc = new jsPDF()
  const portraitMargin = 14
  const landscapeMargin = 10
  const pageWidth = doc.internal.pageSize.getWidth()
  const portraitContentWidth = pageWidth - portraitMargin * 2
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
  const titleLines = doc.splitTextToSize(assessment.title, portraitContentWidth)
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' })

  y += titleLines.length * 7 + 4
  if (assessment.description) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    const descriptionLines = doc.splitTextToSize(assessment.description, portraitContentWidth - 12)
    doc.text(descriptionLines, pageWidth / 2, y, { align: 'center' })
    y += descriptionLines.length * 5 + 6
  }

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Campo', 'Valore']],
    body: [
      ['Struttura', safeValue(assessment.facility_name)],
      ['Reparto / Unità', safeValue(assessment.department)],
      ['Assessor', safeValue(assessment.assessor)],
      ['Data assessment', formatDate(assessment.assessment_date)],
      ['Stato', getGapAssessmentStatusLabel(assessment.status)],
      ['Data export', formatDateTime(new Date().toISOString())],
    ],
    styles: { fontSize: 9, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: portraitContentWidth - 45 },
    },
    margin: { left: portraitMargin, right: portraitMargin, bottom: 18 },
  })

  y = getLastAutoTableY(doc, y) + 12
  y = addPageIfNeeded(doc, y, 55)
  y = addSectionTitle(doc, 'Riepilogo KPI', y)
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Indicatore', 'Valore']],
    body: [
      ['Attività/Requisiti totali', String(evaluations.length || assessment.total_activities)],
      ['Compliance', `${assessment.compliance_percentage || 0}%`],
      ['Conformi', String(assessment.compliant_count)],
      ['Parzialmente conformi', String(assessment.partial_count)],
      ['Non conformi', String(assessment.non_compliant_count)],
      ['Non valutate', String(assessment.not_evaluated_count)],
      ['N.A.', String(assessment.na_count)],
      ['Gap rilevati', String(gapFindings.length)],
      ['Azioni correttive', String(actions.length)],
    ],
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [20, 184, 166], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: portraitMargin, right: portraitMargin, bottom: 18 },
  })

  y = getLastAutoTableY(doc, y) + 12
  y = addGapMethodologySection(doc, y)

  if (chartImages) {
    doc.addPage()
    y = addSectionTitle(doc, 'Analisi grafica', 18)
    y = addParagraph(
      doc,
      "Questa sezione sintetizza graficamente lo stato dell'assessment Gap: conformità complessiva, priorità dei gap e avanzamento del piano azioni correttive. I grafici supportano una lettura executive del report e non sostituiscono il dettaglio tabellare riportato nelle sezioni successive.",
      y,
    )

    y = addChartImage(
      doc,
      chartImages.complianceByDomain,
      'Compliance per Dominio/Sezione',
      'Il grafico evidenzia il livello di conformità raggiunto nei singoli Domini/Sezioni valutati, aiutando a individuare le aree del processo più distanti dal target atteso.',
      y,
    )
    y = addChartImage(
      doc,
      chartImages.complianceDistribution,
      'Distribuzione della conformità',
      'La distribuzione consente di distinguere attività conformi, parzialmente conformi, non conformi, non valutate o non applicabili.',
      y,
    )
    y = addChartImage(
      doc,
      chartImages.priorityDistribution,
      'Priorità dei gap',
      'La priorità dei gap orienta la pianificazione: i gap ad alta priorità richiedono interventi più tempestivi e monitoraggio più stretto.',
      y,
    )
    y = addChartImage(
      doc,
      chartImages.actionStatus,
      'Stato delle azioni correttive',
      "Il grafico mostra l'avanzamento operativo del piano azioni, distinguendo azioni pianificate, in corso, completate, verificate o chiuse.",
      y,
    )
    y = addChartImage(
      doc,
      chartImages.verificationStatus,
      'Verifica di efficacia',
      'Gli esiti di verifica indicano se le azioni completate hanno prodotto un miglioramento efficace, parziale o non efficace.',
      y,
    )
    addLandscapeChartPage(
      doc,
      chartImages.actionGantt,
      'Diagramma di GANTT azioni correttive',
      'Il Diagramma di GANTT rappresenta la pianificazione temporale delle azioni correttive e le milestone di verifica, facilitando il monitoraggio di scadenze e sovrapposizioni operative.',
    )
  }

  doc.addPage('a4', 'landscape')
  y = addSectionTitle(doc, 'Valutazioni', 18, landscapeMargin)
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['Processo', 'Dominio/Sezione', 'Codice', 'Attività/Requisito', 'Target atteso', 'Stato attuale', 'Gap', 'Conformità', 'Priorità']],
    body: evaluations.length > 0
      ? evaluations.map((evaluation) => [
          safeValue(evaluation.process_name_snapshot),
          safeValue(evaluation.area_name_snapshot),
          safeValue(evaluation.activity_code_snapshot),
          safeValue(evaluation.activity_name_snapshot),
          safeValue(targetStateByActivityId[evaluation.activity_id]),
          safeValue(evaluation.current_state),
          safeValue(evaluation.gap_description),
          getComplianceStatusLabel(evaluation.compliance_status),
          getGapRiskPriorityLabel(evaluation.risk_priority),
        ])
      : [['N/D', 'Nessuna valutazione disponibile', 'N/D', 'N/D', 'N/D', 'N/D', 'N/D', 'N/D', 'N/D']],
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', valign: 'top' },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 28 },
      2: { cellWidth: 23 },
      3: { cellWidth: 35 },
      4: { cellWidth: 39 },
      5: { cellWidth: 39 },
      6: { cellWidth: 39 },
      7: { cellWidth: 25 },
      8: { cellWidth: 17 },
    },
    margin: { left: landscapeMargin, right: landscapeMargin, bottom: 18, top: 18 },
  })

  y = getLastAutoTableY(doc, y) + 12
  y = addPageIfNeeded(doc, y, 38, 'landscape')
  y = addSectionTitle(doc, 'Gap rilevati', y, landscapeMargin)
  if (gapFindings.length === 0) {
    y = addEmptyNotice(doc, 'Nessun gap rilevato presente.', y, landscapeMargin)
  } else {
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      head: [['Codice', 'Attività/Requisito', 'Dominio/Sezione', 'Target atteso', 'Gap rilevato', 'Conformità', 'Priorità', 'Azioni']],
      body: gapFindings.map((evaluation) => [
        safeValue(evaluation.activity_code_snapshot),
        safeValue(evaluation.activity_name_snapshot),
        safeValue(evaluation.area_name_snapshot),
        safeValue(targetStateByActivityId[evaluation.activity_id]),
        safeValue(evaluation.gap_description),
        getComplianceStatusLabel(evaluation.compliance_status),
        getGapRiskPriorityLabel(evaluation.risk_priority),
        String(actionsByEvaluationId[evaluation.id]?.length || 0),
      ]),
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 23 },
        1: { cellWidth: 40 },
        2: { cellWidth: 34 },
        3: { cellWidth: 45 },
        4: { cellWidth: 55 },
        5: { cellWidth: 30 },
        6: { cellWidth: 20 },
        7: { cellWidth: 14, halign: 'center' },
      },
      margin: { left: landscapeMargin, right: landscapeMargin, bottom: 18, top: 18 },
    })
    y = getLastAutoTableY(doc, y) + 12
  }

  y = addPageIfNeeded(doc, y, 38, 'landscape')
  y = addSectionTitle(doc, 'Azioni correttive', y, landscapeMargin)
  if (actions.length === 0) {
    y = addEmptyNotice(doc, 'Nessuna azione correttiva presente.', y, landscapeMargin)
  } else {
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      head: [['Descrizione', 'Attività/Requisito', 'Responsabile/i', 'Priorità', 'Stato', 'Progress', 'Fase', 'Date', 'Verifica']],
      body: actions.map((action) => {
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
        }),
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: [22, 163, 74], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 42 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 24 },
        5: { cellWidth: 17, halign: 'center' },
        6: { cellWidth: 25 },
        7: { cellWidth: 32 },
        8: { cellWidth: 32 },
      },
      margin: { left: landscapeMargin, right: landscapeMargin, bottom: 18, top: 18 },
    })
    y = getLastAutoTableY(doc, y) + 12
  }

  const standardsRows = Object.entries(standardsByActivityId).flatMap(([activityId, links]) => {
    const evaluation = evaluationsByActivityId[activityId]
    return links.map((link) => [
      safeValue(evaluation?.activity_code_snapshot),
      safeValue(evaluation?.activity_name_snapshot),
      safeValue(evaluation?.area_name_snapshot),
      safeValue(link.standard?.code),
      safeValue(link.standard?.name),
      link.standard?.is_mandatory ? 'Sì' : 'No',
      safeValue(link.standard?.application_scope),
      getStandardOriginLabel(link.standard?.source_type),
      safeValue(link.standard?.version),
      safeValue(link.standard?.issuing_body),
      safeValue(link.specific_reference),
      safeValue(link.standard?.url),
    ])
  })

  y = addPageIfNeeded(doc, y, 38, 'landscape')
  y = addSectionTitle(doc, 'Riferimenti normativi', y, landscapeMargin)
  if (standardsRows.length === 0) {
    y = addEmptyNotice(doc, 'Nessun riferimento normativo collegato.', y, landscapeMargin)
  } else {
    autoTable(doc, {
      startY: y,
      theme: 'striped',
      head: [['Codice attività', 'Attività/Requisito', 'Dominio/Sezione', 'Codice norma', 'Norma', 'Cogente', 'Ambito / Origine', 'Versione', 'Ente', 'Riferimento', 'URL']],
      body: standardsRows.map((row) => [
        ...row.slice(0, 6),
        `${safeValue(row[6] as string)} / ${safeValue(row[7] as string)}`,
        ...row.slice(8),
      ]),
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: [15, 118, 110], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 21 },
        1: { cellWidth: 34 },
        2: { cellWidth: 28 },
        3: { cellWidth: 20 },
        4: { cellWidth: 38 },
        5: { cellWidth: 15 },
        6: { cellWidth: 26 },
        7: { cellWidth: 16 },
        8: { cellWidth: 24 },
        9: { cellWidth: 30 },
        10: { cellWidth: 15 },
      },
      margin: { left: landscapeMargin, right: landscapeMargin, bottom: 18, top: 18 },
    })
  }

  addFinalSignaturePage(doc, assessment)
  addDocumentFooter(doc, assessment.title)
  doc.save(createFileName(assessment, 'pdf'))
}
