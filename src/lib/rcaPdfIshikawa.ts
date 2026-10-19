import type jsPDF from 'jspdf'
import type { RCAExportBranch, RCAExportData } from '../services/rcaExportService'
import { buildIshikawaFigure, shortenIshikawaLabel } from './rcaIshikawaFigure'

const pageWidth = 297
const pageHeight = 210
const cardWidth = 56
const cardHeight = 70
const spineY = 106

const drawWrappedText = (doc: jsPDF, text: string, x: number, y: number, width: number, maxLines: number) => {
  const lines = (doc.splitTextToSize(shortenIshikawaLabel(text), width) as string[]).slice(0, maxLines)
  doc.text(lines, x, y, { lineHeightFactor: 1.1 })
}

const drawCard = (
  doc: jsPDF,
  branch: RCAExportBranch,
  item: ReturnType<typeof buildIshikawaFigure<RCAExportBranch['causes'][number]>>['items'][number],
  x: number,
  y: number,
  number: number,
) => {
  const borderColor: [number, number, number] = item.hasCandidate ? [252, 165, 165] : [186, 230, 253]
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...borderColor)
  doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  drawWrappedText(doc, `${number}. ${branch.name}`, x + 3, y + 6, cardWidth - 6, 2)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(`${item.totalCauses} ${item.totalCauses === 1 ? 'causa' : 'cause'}`, x + 3, y + 16)

  if (item.totalCauses === 0) {
    doc.text('Nessuna causa', x + 4, y + 30)
    return
  }

  item.visibleCauses.forEach((cause, index) => {
    const causeY = y + 20 + index * 21
    const fillColor: [number, number, number] = cause.is_root_cause ? [254, 242, 242] : [248, 250, 252]
    const causeBorderColor: [number, number, number] = cause.is_root_cause ? [254, 202, 202] : [226, 232, 240]
    const textColor: [number, number, number] = cause.is_root_cause ? [185, 28, 28] : [51, 65, 85]
    doc.setFillColor(...fillColor)
    doc.setDrawColor(...causeBorderColor)
    doc.roundedRect(x + 3, causeY, cardWidth - 6, 18, 1.5, 1.5, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...textColor)
    drawWrappedText(doc, cause.description || 'Causa senza descrizione', x + 5, causeY + 5, cardWidth - 10, 2)
    if (cause.is_root_cause) {
      doc.setFontSize(6)
      doc.text('Candidata', x + 5, causeY + 15)
    }
  })

  if (item.hiddenCount > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(120, 53, 15)
    doc.text(`+${item.hiddenCount} altre cause`, x + 4, y + 66)
  }
}

const drawEffect = (doc: jsPDF, assessment: RCAExportData['assessment']) => {
  const x = 249
  const y = 91
  doc.setFillColor(240, 249, 255)
  doc.setDrawColor(186, 230, 253)
  doc.roundedRect(x, y, 40, 32, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(3, 105, 161)
  doc.text('EFFETTO', x + 3, y + 5)
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)
  drawWrappedText(doc, assessment.event_title || assessment.title, x + 3, y + 11, 34, 2)
  if (assessment.event_description) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    drawWrappedText(doc, assessment.event_description, x + 3, y + 23, 34, 2)
  }
}

export const renderIshikawaPdfPages = (doc: jsPDF, data: Pick<RCAExportData, 'assessment' | 'branches'>) => {
  const pages = Math.max(1, Math.ceil(data.branches.length / 6))

  for (let page = 0; page < pages; page += 1) {
    doc.addPage('a4', 'landscape')
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(15, 23, 42)
    doc.text(`Diagramma Ishikawa${pages > 1 ? ` (${page + 1}/${pages})` : ''}`, 8, 13)

    const branches = data.branches.slice(page * 6, (page + 1) * 6)
    if (branches.length === 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Nessuna categoria Ishikawa attiva.', 14, 30)
      continue
    }

    doc.setDrawColor(2, 132, 199)
    doc.setLineWidth(2.5)
    doc.line(12, spineY, 246, spineY)
    doc.setFillColor(2, 132, 199)
    doc.triangle(246, spineY - 4, 251, spineY, 246, spineY + 4, 'F')
    drawEffect(doc, data.assessment)

    const figure = buildIshikawaFigure(branches, 2)
    figure.items.forEach((item, index) => {
      const column = Math.floor(index / 2)
      const isTop = index % 2 === 0
      const x = 16 + column * 67
      const y = isTop ? 22 : 118
      const connectorColor: [number, number, number] = item.hasCandidate ? [252, 165, 165] : [125, 211, 252]
      doc.setDrawColor(...connectorColor)
      doc.setLineWidth(1.5)
      doc.line(x + cardWidth / 2, isTop ? y + cardHeight : y, x + cardWidth / 2 + 11, spineY)
      drawCard(doc, branches[index], item, x, y, page * 6 + index + 1)
    })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(71, 85, 105)
    doc.text('Figura sintetica: fino a 2 cause per categoria. Descrizioni complete nelle pagine seguenti.', 8, pageHeight - 9)
  }
}
