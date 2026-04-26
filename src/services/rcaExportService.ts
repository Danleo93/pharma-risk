import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toPng } from 'html-to-image'
import * as XLSX from 'xlsx'
import type { RCAAssessment } from '../types'

export interface RCAExportCause {
  id: string
  description: string
  category: string | null
  source_type: string
  is_root_cause: boolean
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
}

export interface RCAExportData {
  assessment: RCAAssessment
  branches: RCAExportBranch[]
  causes: RCAExportCause[]
  candidateCauses: RCAExportCause[]
  fiveWhyChains: RCAExportFiveWhyChain[]
  actions: RCAExportAction[]
}

const statusLabels: Record<string, string> = {
  draft: 'Bozza',
  in_progress: 'In corso',
  action_planned: 'Azioni pianificate',
  completed: 'Completato',
  archived: 'Archiviato',
  planned: 'Pianificata',
  cancelled: 'Annullata',
}

const methodologyLabels: Record<string, string> = {
  '5_whys': '5 Whys',
  fishbone: 'Ishikawa',
  combined: 'Ishikawa + 5 Whys',
}

const severityLabels: Record<string, string> = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
  critical: 'Critica',
}

const eventTypeLabels: Record<string, string> = {
  incident: 'Incidente',
  near_miss: 'Near miss',
  non_conformity: 'Non conformita',
  complaint: 'Reclamo',
  other: 'Altro',
}

const priorityLabels: Record<string, string> = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
  critical: 'Critica',
}

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

const createFileName = (title: string, extension: string) => {
  const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_')
  const date = new Date().toISOString().split('T')[0]
  return `RCA_${cleanTitle}_${date}.${extension}`
}

const getFiveWhyStatus = (stepsCount: number) => {
  if (stepsCount === 0) return 'Da compilare'
  if (stepsCount >= 5) return 'Completa'
  return 'In corso'
}

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

const applyStyles = (element: HTMLElement | SVGElement, styles: Record<string, string>) => {
  Object.entries(styles).forEach(([property, value]) => {
    element.style.setProperty(property, value)
  })
}

const createTextElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text: string,
  styles: Record<string, string> = {},
) => {
  const element = document.createElement(tag)
  element.textContent = text
  applyStyles(element, styles)
  return element
}

const createSvgElement = <K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number>,
) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag)
  Object.entries(attributes).forEach(([attribute, value]) => {
    element.setAttribute(attribute, String(value))
  })
  return element
}

const estimateTextLines = (text: string | null | undefined, charsPerLine = 34) => {
  return Math.max(1, Math.ceil(safeValue(text).length / charsPerLine))
}

const getCausePillHeight = (cause: RCAExportCause) => {
  return 18 + (estimateTextLines(cause.description) * 13)
}

const createIshikawaExportElement = (data: RCAExportData) => {
  const { assessment, branches } = data
  const outerWidth = 1040
  const diagramWidth = 980
  const reportBranches = branches.map((branch, index) => {
    const spacing = branches.length > 1 ? 62 / (branches.length - 1) : 0

    return {
      branch,
      index,
      isTop: index % 2 === 0,
      xPercent: branches.length === 1 ? 44 : 13 + (index * spacing),
    }
  })

  const getCardHeight = (branch: RCAExportBranch) => {
    if (branch.causes.length === 0) return 116
    return 68 + branch.causes.reduce((total, cause) => total + getCausePillHeight(cause) + 8, 0)
  }

  const topHeight = Math.max(
    150,
    ...reportBranches.filter((item) => item.isTop).map((item) => getCardHeight(item.branch) + 22),
  )
  const bottomHeight = Math.max(
    150,
    ...reportBranches.filter((item) => !item.isTop).map((item) => getCardHeight(item.branch) + 22),
  )
  const axisY = topHeight + 54
  const bottomStartY = axisY + 68
  const diagramHeight = topHeight + bottomHeight + 148
  const effectLeft = diagramWidth * 0.83
  const effectWidth = diagramWidth * 0.15
  const cardWidth = Math.max(154, diagramWidth * 0.18)

  const outer = document.createElement('div')
  applyStyles(outer, {
    width: `${outerWidth}px`,
    'box-sizing': 'border-box',
    'background-color': '#ffffff',
    border: '1px solid #e2e8f0',
    'border-radius': '12px',
    padding: '20px',
    'font-family': 'Arial, Helvetica, sans-serif',
    color: '#0f172a',
  })

  const inner = document.createElement('div')
  applyStyles(inner, {
    'box-sizing': 'border-box',
    'background-color': '#f8fafc',
    border: '1px solid #e2e8f0',
    'border-radius': '12px',
    padding: '16px',
  })
  outer.appendChild(inner)

  const header = document.createElement('div')
  applyStyles(header, {
    display: 'flex',
    'justify-content': 'space-between',
    gap: '16px',
    'align-items': 'center',
  })
  inner.appendChild(header)

  const headerText = document.createElement('div')
  header.appendChild(headerText)
  headerText.appendChild(createTextElement('p', 'Figura Ishikawa RCA', {
    margin: '0',
    'font-size': '14px',
    'font-weight': '700',
    color: '#1e293b',
  }))
  headerText.appendChild(createTextElement('p', 'Vista completa per report ed export PNG, con tutte le cause visibili.', {
    margin: '4px 0 0',
    'font-size': '12px',
    color: '#64748b',
  }))

  const headerEffect = document.createElement('div')
  applyStyles(headerEffect, {
    width: '300px',
    'box-sizing': 'border-box',
    'background-color': '#ffffff',
    border: '1px solid #bae6fd',
    'border-radius': '12px',
    padding: '12px 16px',
  })
  header.appendChild(headerEffect)
  headerEffect.appendChild(createTextElement('p', 'Effetto', {
    margin: '0',
    'font-size': '11px',
    'font-weight': '700',
    color: '#0369a1',
    'text-transform': 'uppercase',
  }))
  headerEffect.appendChild(createTextElement('p', assessment.event_title || assessment.title, {
    margin: '4px 0 0',
    'font-size': '13px',
    'font-weight': '700',
    color: '#1e293b',
    'line-height': '1.35',
  }))

  if (branches.length === 0) {
    const empty = createTextElement('div', 'Nessuna categoria Ishikawa attiva.', {
      margin: '20px 0 0',
      padding: '36px',
      'border-radius': '12px',
      border: '1px dashed #cbd5e1',
      'background-color': '#ffffff',
      color: '#64748b',
      'text-align': 'center',
      'font-size': '14px',
    })
    inner.appendChild(empty)
    return outer
  }

  const diagram = document.createElement('div')
  applyStyles(diagram, {
    position: 'relative',
    width: `${diagramWidth}px`,
    height: `${diagramHeight}px`,
    'margin-top': '20px',
    'background-color': 'rgba(255,255,255,0.8)',
    'border-radius': '12px',
    overflow: 'visible',
  })
  inner.appendChild(diagram)

  const svg = createSvgElement('svg', {
    width: diagramWidth,
    height: diagramHeight,
    viewBox: `0 0 ${diagramWidth} ${diagramHeight}`,
  })
  applyStyles(svg, {
    position: 'absolute',
    inset: '0',
    overflow: 'visible',
  })
  diagram.appendChild(svg)

  svg.appendChild(createSvgElement('line', {
    x1: diagramWidth * 0.06,
    y1: axisY,
    x2: diagramWidth * 0.8,
    y2: axisY,
    stroke: '#0284c7',
    'stroke-width': 12,
    'stroke-linecap': 'round',
  }))
  svg.appendChild(createSvgElement('polygon', {
    points: `${diagramWidth * 0.8},${axisY - 22} ${diagramWidth * 0.86},${axisY} ${diagramWidth * 0.8},${axisY + 22}`,
    fill: '#0284c7',
  }))
  svg.appendChild(createSvgElement('line', {
    x1: diagramWidth * 0.06,
    y1: axisY,
    x2: diagramWidth * 0.018,
    y2: axisY - 16,
    stroke: '#94a3b8',
    'stroke-width': 3,
    'stroke-linecap': 'round',
  }))
  svg.appendChild(createSvgElement('line', {
    x1: diagramWidth * 0.06,
    y1: axisY,
    x2: diagramWidth * 0.018,
    y2: axisY + 16,
    stroke: '#94a3b8',
    'stroke-width': 3,
    'stroke-linecap': 'round',
  }))

  const branchLayout = reportBranches.map((item) => {
    const branchX = diagramWidth * (item.xPercent / 100)
    const cardHeight = getCardHeight(item.branch)
    const top = item.isTop ? topHeight - cardHeight : bottomStartY
    const maxLeft = effectLeft - cardWidth - 16
    const cardLeft = Math.max(10, Math.min(branchX - (cardWidth / 2), maxLeft))
    const cardCenterX = cardLeft + (cardWidth / 2)
    const branchEndY = item.isTop ? topHeight - 8 : bottomStartY + 8
    const hasCandidate = item.branch.causes.some((cause) => cause.is_root_cause)

    return {
      ...item,
      branchX,
      cardHeight,
      cardLeft,
      cardCenterX,
      top,
      branchEndY,
      hasCandidate,
    }
  })

  branchLayout.forEach((item) => {
    svg.appendChild(createSvgElement('line', {
      x1: item.branchX,
      y1: axisY,
      x2: item.cardCenterX,
      y2: item.branchEndY,
      stroke: item.hasCandidate ? '#fca5a5' : '#7dd3fc',
      'stroke-width': 6,
      'stroke-linecap': 'round',
    }))
    svg.appendChild(createSvgElement('circle', {
      cx: item.branchX,
      cy: axisY,
      r: 5,
      fill: item.hasCandidate ? '#f87171' : '#0ea5e9',
    }))
  })

  const effectHeight = assessment.event_description ? 94 : 72
  const effectBox = document.createElement('div')
  applyStyles(effectBox, {
    position: 'absolute',
    left: `${effectLeft}px`,
    top: `${axisY - (effectHeight / 2)}px`,
    width: `${effectWidth}px`,
    'min-height': `${effectHeight}px`,
    'box-sizing': 'border-box',
    'border-radius': '12px',
    border: '1px solid #bae6fd',
    'background-color': '#f0f9ff',
    padding: '12px',
    overflow: 'visible',
  })
  diagram.appendChild(effectBox)
  effectBox.appendChild(createTextElement('p', 'Effetto', {
    margin: '0',
    'font-size': '10px',
    'font-weight': '700',
    color: '#0369a1',
    'text-transform': 'uppercase',
    'letter-spacing': '0.03em',
  }))
  effectBox.appendChild(createTextElement('p', assessment.event_title || assessment.title, {
    margin: '5px 0 0',
    'font-size': '12px',
    'font-weight': '700',
    color: '#1e293b',
    'line-height': '1.35',
    'overflow-wrap': 'anywhere',
  }))
  if (assessment.event_description) {
    effectBox.appendChild(createTextElement('p', assessment.event_description, {
      margin: '5px 0 0',
      'font-size': '10px',
      color: '#64748b',
      'line-height': '1.35',
      'overflow-wrap': 'anywhere',
    }))
  }

  branchLayout.forEach((item) => {
    const card = document.createElement('div')
    applyStyles(card, {
      position: 'absolute',
      left: `${item.cardLeft}px`,
      top: `${item.top}px`,
      width: `${cardWidth}px`,
      'min-height': `${item.cardHeight}px`,
      'box-sizing': 'border-box',
      'border-radius': '12px',
      border: item.hasCandidate ? '1px solid #fecaca' : '1px solid #e0f2fe',
      'background-color': '#ffffff',
      padding: '12px',
      'box-shadow': '0 1px 3px rgba(15, 23, 42, 0.08)',
      overflow: 'visible',
    })
    diagram.appendChild(card)

    const cardHeader = document.createElement('div')
    applyStyles(cardHeader, {
      display: 'flex',
      'justify-content': 'space-between',
      gap: '8px',
      'align-items': 'flex-start',
    })
    card.appendChild(cardHeader)

    const titleGroup = document.createElement('div')
    cardHeader.appendChild(titleGroup)
    titleGroup.appendChild(createTextElement('p', item.branch.name, {
      margin: '0',
      'font-size': '12px',
      'font-weight': '700',
      color: '#1e293b',
      'line-height': '1.25',
      'overflow-wrap': 'anywhere',
    }))
    titleGroup.appendChild(createTextElement('p', `${item.branch.causes.length} ${item.branch.causes.length === 1 ? 'causa' : 'cause'}`, {
      margin: '4px 0 0',
      'font-size': '10px',
      color: '#64748b',
    }))

    cardHeader.appendChild(createTextElement('span', `#${item.index + 1}`, {
      display: 'inline-block',
      'border-radius': '999px',
      'background-color': '#f1f5f9',
      padding: '2px 8px',
      'font-size': '10px',
      'font-weight': '700',
      color: '#64748b',
      'white-space': 'nowrap',
    }))

    const causesContainer = document.createElement('div')
    applyStyles(causesContainer, {
      display: 'flex',
      'flex-direction': 'column',
      gap: '8px',
      'margin-top': '12px',
    })
    card.appendChild(causesContainer)

    if (item.branch.causes.length === 0) {
      causesContainer.appendChild(createTextElement('div', 'Nessuna causa', {
        'box-sizing': 'border-box',
        'border-radius': '8px',
        border: '1px dashed #cbd5e1',
        'background-color': '#f8fafc',
        padding: '8px 10px',
        'font-size': '11px',
        color: '#94a3b8',
      }))
      return
    }

    item.branch.causes.forEach((cause) => {
      const causePill = document.createElement('div')
      applyStyles(causePill, {
        'box-sizing': 'border-box',
        'border-radius': '8px',
        border: cause.is_root_cause ? '1px solid #fecaca' : '1px solid #e2e8f0',
        'background-color': cause.is_root_cause ? '#fef2f2' : '#ffffff',
        padding: '8px 10px',
        'font-size': '11px',
        color: cause.is_root_cause ? '#b91c1c' : '#475569',
        'line-height': '1.3',
        'overflow-wrap': 'anywhere',
      })
      causesContainer.appendChild(causePill)
      causePill.appendChild(document.createTextNode(cause.description || 'Causa senza descrizione'))
      if (cause.is_root_cause) {
        causePill.appendChild(createTextElement('span', 'Candidata Root Cause', {
          display: 'block',
          'margin-top': '4px',
          'font-size': '10px',
          'font-weight': '700',
          color: '#b91c1c',
        }))
      }
    })
  })

  return outer
}

const getLiveIshikawaReportElement = () => {
  const diagram = document.querySelector<HTMLElement>('[aria-label="Diagramma Ishikawa RCA per report"]')
  const inner = diagram?.parentElement
  const outer = inner?.parentElement

  return outer instanceof HTMLElement ? outer : null
}

const captureIshikawaElement = async (element: HTMLElement) => {
  const width = Math.max(element.scrollWidth, element.offsetWidth, Math.ceil(element.getBoundingClientRect().width))
  const height = Math.max(element.scrollHeight, element.offsetHeight, Math.ceil(element.getBoundingClientRect().height))
  const dataUrl = await toPng(element, {
    cacheBust: true,
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
    },
  })

  return { dataUrl, width, height }
}

const createIshikawaDiagramImage = async (data: RCAExportData) => {
  const liveElement = getLiveIshikawaReportElement()
  if (liveElement) {
    return captureIshikawaElement(liveElement)
  }

  const element = createIshikawaExportElement(data)
  applyStyles(element, {
    position: 'fixed',
    left: '0',
    top: '0',
    opacity: '0.01',
    'pointer-events': 'none',
    'z-index': '0',
  })
  document.body.appendChild(element)

  try {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    return captureIshikawaElement(element)
  } finally {
    element.remove()
  }
}

const addIshikawaImagePage = async (doc: jsPDF, data: RCAExportData) => {
  doc.addPage('a4', 'landscape')

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 8
  const titleY = 13
  const imageTop = 22
  const maxWidth = pageWidth - (margin * 2)
  const maxHeight = pageHeight - imageTop - margin

  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(15, 23, 42)
  doc.text('Diagramma Ishikawa', margin, titleY)

  const image = await createIshikawaDiagramImage(data)
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height)
  const imageWidth = image.width * scale
  const imageHeight = image.height * scale
  const imageX = (pageWidth - imageWidth) / 2
  const imageY = imageTop + ((maxHeight - imageHeight) / 2)

  doc.addImage(image.dataUrl, 'PNG', imageX, imageY, imageWidth, imageHeight)
}

export const exportRCAToPDF = async (data: RCAExportData) => {
  const { assessment, branches, causes, candidateCauses, fiveWhyChains, actions } = data
  const doc = new jsPDF()
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
      ['5 Whys avviate', fiveWhyChains.filter((chain) => chain.cause_id).length],
      ['Azioni correttive', actions.length],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [14, 165, 233] },
  })
  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y
  y += 12

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

  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, 'Metodologia RCA', y)
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: [
      ['Metodologia', assessment.methodology ? methodologyLabels[assessment.methodology] : 'N/D'],
      ['Severita', assessment.severity ? severityLabels[assessment.severity] : 'N/D'],
      ['Stato', statusLabels[assessment.status] || assessment.status],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
  })
  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 12

  await addIshikawaImagePage(doc, data)

  doc.addPage('a4', 'portrait')
  y = 18

  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, 'Sintesi Ishikawa', y)
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['Categoria', 'Cause', 'Candidate']],
    body: branches.length === 0
      ? [['N/D', 'Nessuna categoria attiva', '0']]
      : branches.map((branch) => [
        branch.name,
        branch.causes.length,
        branch.causes.filter((cause) => cause.is_root_cause).length,
      ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [51, 65, 85] },
  })
  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 12

  y = addPageIfNeeded(doc, y)
  y = addSectionTitle(doc, 'Cause candidate e analisi', y)
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Causa candidata', 'Categoria', 'Stato 5 Whys', 'Preview']],
    body: candidateCauses.length === 0
      ? [['N/D', 'N/D', 'N/D', 'Nessuna causa candidata selezionata']]
      : candidateCauses.map((cause) => {
        const chain = fiveWhyChains.find((item) => item.cause_id === cause.id)
        const steps = chain?.steps || []
        const preview = steps.slice(0, 3).map((step) => `${step.step_number}. ${step.answer}`).join('\n')
        const remaining = steps.length > 3 ? `\n+${steps.length - 3} altri` : ''
        return [
          cause.description,
          safeValue(cause.category),
          getFiveWhyStatus(steps.length),
          preview ? `${preview}${remaining}` : 'Nessun perche compilato',
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
    head: [['Descrizione', 'Causa', 'Responsabile', 'Scadenza', 'Priorita', 'Stato']],
    body: actions.length === 0
      ? [['N/D', 'N/D', 'N/D', 'N/D', 'N/D', 'Nessuna azione correttiva']]
      : actions.map((action) => [
        action.description,
        safeValue(action.cause_description),
        safeValue(action.responsible),
        formatDate(action.due_date),
        action.priority ? priorityLabels[action.priority] : 'N/D',
        statusLabels[action.status] || action.status,
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
      ['Rivalutazione prevista', 'Da pianificare'],
      ['Effectiveness check', 'Da definire dopo implementazione azioni'],
      ['Responsabile / Firma', 'Non assegnato'],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
  })

  doc.save(createFileName(assessment.title, 'pdf'))
}

export const exportRCAToExcel = (data: RCAExportData) => {
  const { assessment, branches, causes, candidateCauses, fiveWhyChains, actions } = data
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Campo', 'Valore'],
    ['Titolo', assessment.title],
    ['Evento', safeValue(assessment.event_title)],
    ['Tipologia', assessment.event_type ? eventTypeLabels[assessment.event_type] : 'N/D'],
    ['Data evento', formatDate(assessment.event_date)],
    ['Ora evento', assessment.event_time ? assessment.event_time.slice(0, 5) : 'N/D'],
    ['Area coinvolta', [assessment.location, assessment.department].filter(Boolean).join(' - ') || 'N/D'],
    ['Metodologia', assessment.methodology ? methodologyLabels[assessment.methodology] : 'N/D'],
    ['Severita', assessment.severity ? severityLabels[assessment.severity] : 'N/D'],
    ['Stato', statusLabels[assessment.status] || assessment.status],
  ]), 'Info')

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Indicatore', 'Valore'],
    ['Categorie attive', branches.length],
    ['Cause totali', causes.length],
    ['Cause candidate', candidateCauses.length],
    ['5 Whys avviate', fiveWhyChains.filter((chain) => chain.cause_id).length],
    ['Azioni correttive', actions.length],
  ]), 'KPI')

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(branches.map((branch) => ({
    Categoria: branch.name,
    Tipo: branch.source_type,
    Cause: branch.causes.length,
    Candidate: branch.causes.filter((cause) => cause.is_root_cause).length,
  }))), 'Ishikawa')

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(causes.map((cause) => ({
    Descrizione: cause.description,
    Categoria: safeValue(cause.category),
    Fonte: cause.source_type,
    CandidataRootCause: cause.is_root_cause ? 'Si' : 'No',
  }))), 'Cause')

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fiveWhyChains.flatMap((chain) => {
    if (chain.steps.length === 0) {
      return [{
        Causa: safeValue(chain.cause_description),
        Categoria: safeValue(chain.cause_category),
        StatoAnalisi: getFiveWhyStatus(0),
        Step: '',
        Domanda: '',
        Risposta: '',
      }]
    }

    return chain.steps.map((step) => ({
      Causa: safeValue(chain.cause_description),
      Categoria: safeValue(chain.cause_category),
      StatoAnalisi: getFiveWhyStatus(chain.steps.length),
      Step: String(step.step_number),
      Domanda: step.why_question,
      Risposta: step.answer,
    }))
  })), '5 Whys')

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(actions.map((action) => ({
    Descrizione: action.description,
    Causa: safeValue(action.cause_description),
    Categoria: safeValue(action.cause_category),
    Responsabile: safeValue(action.responsible),
    Scadenza: formatDate(action.due_date),
    Priorita: action.priority ? priorityLabels[action.priority] : 'N/D',
    Stato: statusLabels[action.status] || action.status,
  }))), 'Azioni')

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Campo', 'Valore'],
    ['Rivalutazione prevista', 'Da pianificare'],
    ['Effectiveness check', 'Da definire dopo implementazione azioni'],
    ['Responsabile / Firma', 'Non assegnato'],
  ]), 'Monitoraggio')

  XLSX.writeFile(wb, createFileName(assessment.title, 'xlsx'))
}
