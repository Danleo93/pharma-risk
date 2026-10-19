import type jsPDF from 'jspdf'
import type { RCAAssessment } from '../types'
import { loadPdfEngine, loadXlsx, type XlsxEngine } from '../lib/exportEngines'
import {
  RCA_EVENT_TYPE_LABELS,
  RCA_METHODOLOGY_LABELS,
  getEffectiveRootCauseStatus,
  getRCAActionStatusLabel,
  getRCAAssessmentStatusLabel,
  getRCAPriorityLabel,
  getRCASeverityLabel,
  getRootCauseStatusLabel,
} from '../lib/labels'
import { sanitizeSpreadsheetRecords, sanitizeSpreadsheetRows } from '../lib/spreadsheetSecurity'
import { ensureRuntimeModuleCanExport } from '../lib/moduleRuntime'
import { confirmExportPrivacy, createNeutralExportFileName } from '../lib/privacyRuntime'
import { renderIshikawaPdfPages } from '../lib/rcaPdfIshikawa'

const aoaToSafeSheet = (XLSX: XlsxEngine, rows: unknown[][]) => XLSX.utils.aoa_to_sheet(sanitizeSpreadsheetRows(rows))
const jsonToSafeSheet = <T extends Record<string, unknown>>(XLSX: XlsxEngine, records: T[]) => (
  XLSX.utils.json_to_sheet(sanitizeSpreadsheetRecords(records))
)

export interface RCAExportCause {
  id: string
  description: string
  category: string | null
  source_type: string
  is_root_cause: boolean
  root_cause_status: string | null
  root_cause_confirmed_at: string | null
  root_cause_confirmation_notes: string | null
}

export interface RCAExportBranch {
  id: string
  name: string
  source_type: string
  causes: RCAExportCause[]
}

export interface RCAExportFiveWhyStep {
  id: string
  step_number: number
  why_question: string
  answer: string
}

export interface RCAExportFiveWhyChain {
  id: string
  cause_id: string | null
  title: string
  problem_statement: string
  status: string
  cause_description: string | null
  cause_category: string | null
  cause_root_cause_status: string | null
  cause_root_cause_confirmation_notes: string | null
  steps: RCAExportFiveWhyStep[]
}

export interface RCAExportAction {
  id: string
  description: string
  cause_description: string | null
  cause_category: string | null
  responsible: string | null
  due_date: string | null
  priority: string | null
  status: string
  cause_root_cause_status?: string | null
}

export interface RCAExportMonitoring {
  reevaluationStatus: string
  effectivenessStatus: string
  responsibleSignature: string
}

export interface RCAExportData {
  assessment: RCAAssessment
  branches: RCAExportBranch[]
  causes: RCAExportCause[]
  candidateCauses: RCAExportCause[]
  fiveWhyChains: RCAExportFiveWhyChain[]
  actions: RCAExportAction[]
  monitoring?: RCAExportMonitoring
}

const methodologyLabels = RCA_METHODOLOGY_LABELS
const eventTypeLabels = RCA_EVENT_TYPE_LABELS

const formatDate = (date: string | null | undefined) => {
  return date ? new Date(date).toLocaleDateString('it-IT') : 'N/D'
}

const formatDateTime = (date: string | null | undefined, time: string | null | undefined) => {
  const formattedDate = formatDate(date)
  const formattedTime = time ? time.slice(0, 5) : 'N/D'
  return `${formattedDate} ${formattedTime}`
}

const safeValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return 'N/D'
  return String(value)
}

const createFileName = (_title: string, extension: 'pdf' | 'xlsx') => (
  createNeutralExportFileName('RCA', new Date(), extension)
)

const getFiveWhyStatus = (stepsCount: number) => {
  if (stepsCount === 0) return 'Da compilare'
  if (stepsCount >= 5) return 'Completa'
  return 'In corso'
}

const getRCAMonitoringSummary = (data: Pick<RCAExportData, 'actions' | 'monitoring'>): RCAExportMonitoring => {
  if (data.monitoring) return data.monitoring

  const totalActions = data.actions.length
  const completedActions = data.actions.filter((action) => action.status === 'completed').length
  const allActionsCompleted = totalActions > 0 && completedActions === totalActions
  const hasSomeCompletedActions = completedActions > 0 && !allActionsCompleted

  return {
    reevaluationStatus: allActionsCompleted
      ? 'Rivalutazione raccomandata'
      : hasSomeCompletedActions
        ? 'Da rivalutare dopo completamento azioni'
        : 'Da pianificare',
    effectivenessStatus: allActionsCompleted
      ? 'Pronto per verifica di efficacia'
      : hasSomeCompletedActions
        ? 'Parzialmente valutabile'
        : 'Da definire dopo implementazione azioni',
    responsibleSignature: 'Non assegnato',
  }
}

const getRootCauseStatusLabelFromStatus = (status: string | null | undefined) => {
  return getRootCauseStatusLabel(status, 'Non candidata') || 'Non candidata'
}


const rcaMethodologyNotes = [
  ['RCA', 'Analisi strutturata di evento, incidente o near miss per individuare cause contributive e prevenire recidive.'],
  ['Ishikawa', 'Mappa causa-effetto che organizza le cause candidate per categoria e mantiene visibile il legame con l evento.'],
  ['5 Whys', 'Approfondimento iterativo della causa candidata fino a un esito metodologico documentato.'],
  ['Esito Root Cause', 'La causa candidata puo restare candidata, essere confermata come Root Cause o risultare non confermata.'],
  ['Azioni correttive', 'Le azioni sono collegate alle cause, con responsabilita, priorita, scadenza e stato di avanzamento.'],
]

const rootCauseStatusLegend = [
  ['Candidata Root Cause', 'Causa candidata emersa da Ishikawa, da approfondire o ancora non conclusa.'],
  ['Root Cause confermata', 'Causa confermata dopo analisi 5 Whys o valutazione metodologica.'],
  ['Non confermata', 'Causa candidata esclusa come Root Cause dopo approfondimento.'],
]

const addSectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(title, 14, y)
  return y + 7
}

const addPageIfNeeded = (doc: jsPDF, y: number, neededSpace = 35) => {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + neededSpace <= pageHeight - 14) return y
  doc.addPage()
  return 18
}


export const exportRCAToPDF = async (data: RCAExportData) => {
  if (!ensureRuntimeModuleCanExport('RCA')) return
  if (!confirmExportPrivacy()) return
  const { jsPDF, autoTable } = await loadPdfEngine()
  const { assessment, branches, causes, candidateCauses, fiveWhyChains, actions } = data
  const confirmedRootCauses = candidateCauses.filter((cause) => getEffectiveRootCauseStatus(cause) === 'confirmed')
  const notConfirmedRootCauses = candidateCauses.filter((cause) => getEffectiveRootCauseStatus(cause) === 'not_confirmed')
  const monitoring = getRCAMonitoringSummary(data)
  const doc = new jsPDF()
  doc.setProperties({
    title: 'PhaRMA T - Report RCA',
    subject: 'Report metodologico RCA',
    author: 'PhaRMA T',
    creator: 'PhaRMA T',
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 18

  doc.setFillColor(14, 116, 144)
  doc.rect(0, 0, pageWidth, 34, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('Report RCA', 14, 18)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(assessment.title, 14, 27)

  y = 48
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Indicatore', 'Valore']],
    body: [
      ['Categorie attive', branches.length],
      ['Cause totali', causes.length],
      ['Cause candidate', candidateCauses.length],
      ['Root cause confermate', confirmedRootCauses.length],
      ['Non confermate', notConfirmedRootCauses.length],
      ['5 Whys avviate', fiveWhyChains.filter((chain) => chain.cause_id).length],
      ['Azioni correttive', actions.length],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [14, 165, 233] },
  })
  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y
  y += 12

  y = addPageIfNeeded(doc, y, 28)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  const useLimitNote = 'Nota d uso: il presente report e generato a fini formativi, metodologici e documentali. Non costituisce dispositivo medico, valutazione clinica automatizzata o indicazione per decisioni cliniche dirette.'
  const useLimitLines = doc.splitTextToSize(useLimitNote, pageWidth - 28)
  doc.text(useLimitLines, 14, y)
  y += useLimitLines.length * 4.5 + 8

  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, 'Dati evento', y)
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    body: [
      ['Evento', safeValue(assessment.event_title)],
      ['Tipologia', assessment.event_type ? eventTypeLabels[assessment.event_type] : 'N/D'],
      ['Data e ora', formatDateTime(assessment.event_date, assessment.event_time)],
      ['Area coinvolta', [assessment.location, assessment.department].filter(Boolean).join(' - ') || 'N/D'],
      ['Descrizione', safeValue(assessment.event_description)],
      ['Contenimento immediato', safeValue(assessment.immediate_containment)],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
  })
  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 12

  y = addPageIfNeeded(doc, y, 95)
  y = addSectionTitle(doc, 'METODOLOGIA RCA', y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(55, 65, 81)
  const methodologyIntro = "La Root Cause Analysis (RCA) documenta un evento, incidente o near miss per individuare le cause che hanno contribuito all'accadimento e trasformarle in azioni correttive tracciabili. Nel presente report Ishikawa supporta la mappatura causa-effetto, mentre le 5 Whys approfondiscono le cause candidate fino all'esito metodologico."
  const methodologyLines = doc.splitTextToSize(methodologyIntro, pageWidth - 28)
  doc.text(methodologyLines, 14, y)
  y += methodologyLines.length * 4.5 + 6

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Elemento', 'Criterio documentale']],
    body: rcaMethodologyNotes,
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: [14, 116, 144] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 38 },
      1: { cellWidth: pageWidth - 66 },
    },
  })
  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 8

  y = addPageIfNeeded(doc, y, 45)
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['Esito Root Cause', 'Interpretazione']],
    body: rootCauseStatusLegend,
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: [51, 65, 85] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: pageWidth - 78 },
    },
  })
  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 8

  y = addPageIfNeeded(doc, y, 35)
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    body: [
      ['Metodologia', assessment.methodology ? methodologyLabels[assessment.methodology] : 'N/D'],
      ['Severita', assessment.severity ? getRCASeverityLabel(assessment.severity) : 'N/D'],
      ['Stato', getRCAAssessmentStatusLabel(assessment.status)],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
  })
  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 12

  renderIshikawaPdfPages(doc, data)

  doc.addPage('a4', 'portrait')
  y = 18

  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, 'Sintesi Ishikawa', y)
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['Categoria', 'Cause', 'Candidate', 'Confermate', 'Non confermate']],
    body: branches.length === 0
      ? [['N/D', 'Nessuna categoria attiva', '0', '0', '0']]
      : branches.map((branch) => [
        branch.name,
        branch.causes.length,
        branch.causes.filter((cause) => cause.is_root_cause).length,
        branch.causes.filter((cause) => getEffectiveRootCauseStatus(cause) === 'confirmed').length,
        branch.causes.filter((cause) => getEffectiveRootCauseStatus(cause) === 'not_confirmed').length,
      ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [51, 65, 85] },
  })
  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 12

  const allIshikawaCauseRows = branches.flatMap((branch) => branch.causes.map((cause, index) => [
    branch.name,
    index + 1,
    cause.description,
    getRootCauseStatusLabel(cause, 'Non candidata') || 'Non candidata',
  ]))
  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, 'Elenco completo delle cause Ishikawa', y)
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['Categoria', 'N.', 'Descrizione integrale', 'Esito']],
    body: allIshikawaCauseRows.length > 0
      ? allIshikawaCauseRows
      : [['N/D', '', 'Nessuna causa Ishikawa registrata', '']],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 10 },
      2: { cellWidth: 108 },
      3: { cellWidth: 30 },
    },
  })
  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 12

  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, 'Cause candidate e analisi', y)
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Causa candidata', 'Categoria', 'Esito Root Cause', 'Stato 5 Whys', 'Preview', 'Nota esito']],
    body: candidateCauses.length === 0
      ? [['N/D', 'N/D', 'N/D', 'N/D', 'Nessuna causa candidata selezionata', 'N/D']]
      : candidateCauses.map((cause) => {
        const chain = fiveWhyChains.find((item) => item.cause_id === cause.id)
        const steps = chain?.steps || []
        const preview = steps.slice(0, 3).map((step) => `${step.step_number}. ${step.answer}`).join('\n')
        const remaining = steps.length > 3 ? `\n+${steps.length - 3} altri` : ''
        return [
          cause.description,
          safeValue(cause.category),
          getRootCauseStatusLabel(cause, 'Non candidata') || 'Non candidata',
          getFiveWhyStatus(steps.length),
          preview ? `${preview}${remaining}` : 'Nessun perche compilato',
          safeValue(cause.root_cause_confirmation_notes),
        ]
      }),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [14, 165, 233] },
  })
  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 12

  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, "Piano d'azione", y)
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Descrizione', 'Causa', 'Esito causa', 'Responsabile', 'Scadenza', 'Priorita', 'Stato']],
    body: actions.length === 0
      ? [['N/D', 'N/D', 'N/D', 'N/D', 'N/D', 'N/D', 'Nessuna azione correttiva']]
      : actions.map((action) => [
        action.description,
        safeValue(action.cause_description),
        getRootCauseStatusLabelFromStatus(action.cause_root_cause_status),
        safeValue(action.responsible),
        formatDate(action.due_date),
        action.priority ? getRCAPriorityLabel(action.priority) : 'N/D',
        getRCAActionStatusLabel(action.status),
      ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [34, 197, 94] },
  })
  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 12

  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, 'Monitoraggio', y)
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: [
      ['Rivalutazione prevista', monitoring.reevaluationStatus],
      ['Effectiveness check', monitoring.effectivenessStatus],
      ['Responsabile / Firma', monitoring.responsibleSignature],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
  })

  doc.save(createFileName(assessment.title, 'pdf'))
}

export const exportRCAToExcel = async (data: RCAExportData) => {
  if (!ensureRuntimeModuleCanExport('RCA')) return
  if (!confirmExportPrivacy()) return
  const XLSX = await loadXlsx()
  const { assessment, branches, causes, candidateCauses, fiveWhyChains, actions } = data
  const confirmedRootCauses = candidateCauses.filter((cause) => getEffectiveRootCauseStatus(cause) === 'confirmed')
  const notConfirmedRootCauses = candidateCauses.filter((cause) => getEffectiveRootCauseStatus(cause) === 'not_confirmed')
  const monitoring = getRCAMonitoringSummary(data)
  const wb = XLSX.utils.book_new()
  wb.Props = {
    Title: 'PhaRMA T - Report RCA',
    Subject: 'Report metodologico RCA',
    Author: 'PhaRMA T',
    Company: 'PhaRMA T',
    Comments: 'Generato da PhaRMA T',
  }

  XLSX.utils.book_append_sheet(wb, aoaToSafeSheet(XLSX, [
    ['Campo', 'Valore'],
    ['Titolo', assessment.title],
    ['Evento', safeValue(assessment.event_title)],
    ['Tipologia', assessment.event_type ? eventTypeLabels[assessment.event_type] : 'N/D'],
    ['Data evento', formatDate(assessment.event_date)],
    ['Ora evento', assessment.event_time ? assessment.event_time.slice(0, 5) : 'N/D'],
    ['Area coinvolta', [assessment.location, assessment.department].filter(Boolean).join(' - ') || 'N/D'],
    ['Metodologia', assessment.methodology ? methodologyLabels[assessment.methodology] : 'N/D'],
    ['Severita', assessment.severity ? getRCASeverityLabel(assessment.severity) : 'N/D'],
    ['Stato', getRCAAssessmentStatusLabel(assessment.status)],
  ]), 'Info')

  XLSX.utils.book_append_sheet(wb, aoaToSafeSheet(XLSX, [
    ['Elemento', 'Criterio documentale'],
    ...rcaMethodologyNotes,
    [],
    ['Esito Root Cause', 'Interpretazione'],
    ...rootCauseStatusLegend,
  ]), 'Metodo RCA')

  XLSX.utils.book_append_sheet(wb, aoaToSafeSheet(XLSX, [
    ['Indicatore', 'Valore'],
    ['Categorie attive', branches.length],
    ['Cause totali', causes.length],
    ['Cause candidate', candidateCauses.length],
    ['Root cause confermate', confirmedRootCauses.length],
    ['Non confermate', notConfirmedRootCauses.length],
    ['5 Whys avviate', fiveWhyChains.filter((chain) => chain.cause_id).length],
    ['Azioni correttive', actions.length],
  ]), 'KPI')

  XLSX.utils.book_append_sheet(wb, jsonToSafeSheet(XLSX, branches.map((branch) => ({
    Categoria: branch.name,
    Tipo: branch.source_type,
    Cause: branch.causes.length,
    Candidate: branch.causes.filter((cause) => cause.is_root_cause).length,
    Confermate: branch.causes.filter((cause) => getEffectiveRootCauseStatus(cause) === 'confirmed').length,
    NonConfermate: branch.causes.filter((cause) => getEffectiveRootCauseStatus(cause) === 'not_confirmed').length,
  }))), 'Ishikawa')

  XLSX.utils.book_append_sheet(wb, jsonToSafeSheet(XLSX, causes.map((cause) => ({
    Descrizione: cause.description,
    Categoria: safeValue(cause.category),
    Fonte: cause.source_type,
    CandidataRootCause: cause.is_root_cause ? 'Si' : 'No',
    EsitoRootCause: getRootCauseStatusLabel(cause, 'Non candidata') || 'Non candidata',
    DataConferma: formatDate(cause.root_cause_confirmed_at),
    NoteConferma: safeValue(cause.root_cause_confirmation_notes),
  }))), 'Cause')

  XLSX.utils.book_append_sheet(wb, jsonToSafeSheet(XLSX, fiveWhyChains.flatMap((chain) => {
    if (chain.steps.length === 0) {
      return [{
        Causa: safeValue(chain.cause_description),
        Categoria: safeValue(chain.cause_category),
        EsitoRootCause: getRootCauseStatusLabelFromStatus(chain.cause_root_cause_status),
        StatoAnalisi: getFiveWhyStatus(0),
        Step: '',
        Domanda: '',
        Risposta: '',
      }]
    }

    return chain.steps.map((step) => ({
      Causa: safeValue(chain.cause_description),
      Categoria: safeValue(chain.cause_category),
      EsitoRootCause: getRootCauseStatusLabelFromStatus(chain.cause_root_cause_status),
      StatoAnalisi: getFiveWhyStatus(chain.steps.length),
      Step: String(step.step_number),
      Domanda: step.why_question,
      Risposta: step.answer,
    }))
  })), '5 Whys')

  XLSX.utils.book_append_sheet(wb, jsonToSafeSheet(XLSX, actions.map((action) => ({
    Descrizione: action.description,
    Causa: safeValue(action.cause_description),
    Categoria: safeValue(action.cause_category),
    EsitoCausa: getRootCauseStatusLabelFromStatus(action.cause_root_cause_status),
    Responsabile: safeValue(action.responsible),
    Scadenza: formatDate(action.due_date),
    Priorita: action.priority ? getRCAPriorityLabel(action.priority) : 'N/D',
    Stato: getRCAActionStatusLabel(action.status),
  }))), 'Azioni')

  XLSX.utils.book_append_sheet(wb, aoaToSafeSheet(XLSX, [
    ['Campo', 'Valore'],
    ['Rivalutazione prevista', monitoring.reevaluationStatus],
    ['Effectiveness check', monitoring.effectivenessStatus],
    ['Responsabile / Firma', monitoring.responsibleSignature],
  ]), 'Monitoraggio')

  XLSX.writeFile(wb, createFileName(assessment.title, 'xlsx'))
}
