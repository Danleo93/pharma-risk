import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { RiskAssessment, RiskItem } from '../types'

interface ExportData {
  assessment: RiskAssessment
  riskItems: RiskItem[]
  facilityName?: string
}

export const exportToPDF = ({ assessment, riskItems, facilityName }: ExportData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Header
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  if (facilityName) {
    doc.text(facilityName, 14, 15)
  }
  doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, pageWidth - 14, 15, { align: 'right' })

  // Title
  doc.setFontSize(20)
  doc.setTextColor(0, 0, 0)
  doc.text('Risk Assessment FMEA', 14, 30)

  // Assessment info
  doc.setFontSize(14)
  doc.setTextColor(50, 50, 50)
  doc.text(assessment.title, 14, 42)

  if (assessment.description) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(assessment.description, 14, 50)
  }

  // Stats
  const stats = {
    total: riskItems.length,
    high: riskItems.filter(r => r.risk_class === 'Alta').length,
    medium: riskItems.filter(r => r.risk_class === 'Media').length,
    low: riskItems.filter(r => r.risk_class === 'Bassa').length,
  }

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  const statsY = assessment.description ? 60 : 52
  doc.text(`Rischi totali: ${stats.total}  |  Alto: ${stats.high}  |  Medio: ${stats.medium}  |  Basso: ${stats.low}`, 14, statsY)

  // Risk table
  const tableData = riskItems.map((item, index) => [
    String(index + 1),
    item.risk_catalog_base?.name || item.custom_risk_name || 'N/D',
    item.risk_catalog_base?.category || '-',
    item.severity?.toString() || '-',
    item.probability?.toString() || '-',
    item.detectability?.toString() || '-',
    item.rpn?.toString() || '-',
    item.risk_class || 'N/D'
  ])

  autoTable(doc, {
    startY: statsY + 10,
    head: [['#', 'Rischio', 'Categoria', 'S', 'P', 'D', 'RPN', 'Classe']],
    body: tableData,
    headStyles: {
      fillColor: [14, 165, 233], // sky-500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 35 },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'center', cellWidth: 12 },
      6: { halign: 'center', cellWidth: 15 },
      7: { halign: 'center', cellWidth: 20 }
    },
    bodyStyles: {
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (data) => {
      // Colora la cella della classe di rischio
      if (data.column.index === 7 && data.section === 'body') {
        const value = data.cell.raw as string
        if (value === 'Alta') {
          data.cell.styles.fillColor = [254, 202, 202] // red-200
          data.cell.styles.textColor = [185, 28, 28] // red-700
        } else if (value === 'Media') {
          data.cell.styles.fillColor = [254, 240, 138] // yellow-200
          data.cell.styles.textColor = [161, 98, 7] // yellow-700
        } else if (value === 'Bassa') {
          data.cell.styles.fillColor = [187, 247, 208] // green-200
          data.cell.styles.textColor = [21, 128, 61] // green-700
        }
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Pagina ${i} di ${pageCount} - Pharma Risk Assessment Tool`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Download
  const fileName = `${assessment.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

export const exportToExcel = ({ assessment, riskItems, facilityName }: ExportData) => {
  // Prepara i dati
  const data = riskItems.map((item, index) => ({
    '#': index + 1,
    'Rischio': item.risk_catalog_base?.name || item.custom_risk_name || 'N/D',
    'Categoria': item.risk_catalog_base?.category || '-',
    'Severità (S)': item.severity || '-',
    'Probabilità (P)': item.probability || '-',
    'Rilevabilità (D)': item.detectability || '-',
    'RPN': item.rpn || '-',
    'Hazard Score': item.hazard_score || '-',
    'Classe Rischio': item.risk_class || 'N/D',
    'Note': item.notes || ''
  }))

  // Crea worksheet
  const ws = XLSX.utils.json_to_sheet(data)

  // Imposta larghezza colonne
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 40 },  // Rischio
    { wch: 25 },  // Categoria
    { wch: 12 },  // S
    { wch: 12 },  // P
    { wch: 12 },  // D
    { wch: 8 },   // RPN
    { wch: 12 },  // Hazard Score
    { wch: 15 },  // Classe
    { wch: 30 },  // Note
  ]

  // Crea workbook
  const wb = XLSX.utils.book_new()
  
  // Aggiungi info assessment come primo foglio
  const infoData = [
    ['Risk Assessment FMEA'],
    [''],
    ['Titolo:', assessment.title],
    ['Descrizione:', assessment.description || '-'],
    ['Struttura:', facilityName || '-'],
    ['Data creazione:', new Date(assessment.created_at).toLocaleDateString('it-IT')],
    ['Data export:', new Date().toLocaleDateString('it-IT')],
    [''],
    ['Statistiche:'],
    ['Rischi totali:', riskItems.length],
    ['Rischio Alto:', riskItems.filter(r => r.risk_class === 'Alta').length],
    ['Rischio Medio:', riskItems.filter(r => r.risk_class === 'Media').length],
    ['Rischio Basso:', riskItems.filter(r => r.risk_class === 'Bassa').length],
  ]
  const wsInfo = XLSX.utils.aoa_to_sheet(infoData)
  wsInfo['!cols'] = [{ wch: 20 }, { wch: 50 }]

  XLSX.utils.book_append_sheet(wb, wsInfo, 'Info')
  XLSX.utils.book_append_sheet(wb, ws, 'Rischi')

  // Download
  const fileName = `${assessment.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}