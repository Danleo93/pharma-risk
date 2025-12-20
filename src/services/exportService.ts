import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { RiskAssessment, RiskItem, ActionPlan } from '../types'

interface ExportData {
  assessment: RiskAssessment
  riskItems: RiskItem[]
  facilityName?: string
  actions?: ActionPlan[]
  paretoThreshold?: number
}

// Funzione helper per parsare categoria
const parseCategory = (category: string): { area: string; subArea: string | null } => {
  if (category?.includes(' - ')) {
    const [area, subArea] = category.split(' - ')
    return { area: area.trim(), subArea: subArea.trim() }
  }
  return { area: category || 'Altro', subArea: null }
}

export const exportToPDF = ({ assessment, riskItems, facilityName, actions = [], paretoThreshold = 80 }: ExportData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  
  // Calcoli statistiche
  const highRisks = riskItems.filter(r => r.risk_class === 'Alta')
  const mediumRisks = riskItems.filter(r => r.risk_class === 'Media')
  const lowRisks = riskItems.filter(r => r.risk_class === 'Bassa')
  const risksWithActions = riskItems.filter(r => actions.some(a => a.risk_item_id === r.id))
  const completedActions = actions.filter(a => a.status === 'completed')
  const totalRPN = riskItems.reduce((sum, r) => sum + (r.rpn || 0), 0)
  const avgRPN = riskItems.length > 0 ? Math.round(totalRPN / riskItems.length) : 0
  
  // Raggruppa per categoria
  const risksByCategory: Record<string, RiskItem[]> = {}
  riskItems.forEach(item => {
    const category = item.risk_catalog_base?.category || 'Altro'
    if (!risksByCategory[category]) {
      risksByCategory[category] = []
    }
    risksByCategory[category].push(item)
  })

  // Calcola statistiche per area
  const areaStats: Record<string, { count: number; totalRPN: number; highCount: number }> = {}
  Object.entries(risksByCategory).forEach(([category, risks]) => {
    const { area } = parseCategory(category)
    if (!areaStats[area]) {
      areaStats[area] = { count: 0, totalRPN: 0, highCount: 0 }
    }
    areaStats[area].count += risks.length
    areaStats[area].totalRPN += risks.reduce((sum, r) => sum + (r.rpn || 0), 0)
    areaStats[area].highCount += risks.filter(r => r.risk_class === 'Alta').length
  })

  // Top 3 aree critiche per RPN medio
  const topAreas = Object.entries(areaStats)
    .map(([area, stats]) => ({
      area,
      ...stats,
      avgRPN: stats.count > 0 ? Math.round(stats.totalRPN / stats.count) : 0
    }))
    .sort((a, b) => b.avgRPN - a.avgRPN)
    .slice(0, 3)

  // ============================================
  // PAGINA 1 - COPERTINA
  // ============================================
  
  // Header
  doc.setFillColor(30, 58, 100) // blue-900 (navy)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('PhaRMA T - RISK ASSESSMENT REPORT', pageWidth / 2, 25, { align: 'center' })
  
  // Titolo assessment
  doc.setTextColor(31, 41, 55) // gray-800
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(assessment.title, pageWidth / 2, 60, { align: 'center' })
  
  // Descrizione
  if (assessment.description) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128) // gray-500
    const descLines = doc.splitTextToSize(assessment.description, pageWidth - 60)
    doc.text(descLines, pageWidth / 2, 72, { align: 'center' })
  }
  
  // Box informazioni
  const boxY = 95
  doc.setFillColor(249, 250, 251) // gray-50
  doc.roundedRect(margin, boxY, pageWidth - margin * 2, 70, 3, 3, 'F')
  doc.setDrawColor(229, 231, 235) // gray-200
  doc.roundedRect(margin, boxY, pageWidth - margin * 2, 70, 3, 3, 'S')
  
  doc.setFontSize(11)
  doc.setTextColor(55, 65, 81) // gray-700
  doc.setFont('helvetica', 'bold')
  
const col1Label = margin + 10
const col1Value = margin + 45
const col2Label = pageWidth / 2 + 10
const col2Value = pageWidth / 2 + 45
let infoY = boxY + 15

const statusMap: Record<string, string> = {
  'draft': 'Bozza',
  'in_progress': 'In Corso',
  'completed': 'Completato'
}

// Struttura su riga intera (per nomi lunghi)
doc.setFont('helvetica', 'bold')
doc.text('Struttura:', col1Label, infoY)
doc.setFont('helvetica', 'normal')
const facilityText = facilityName || '—'
// Tronca se troppo lungo
const maxFacilityWidth = pageWidth - margin * 2 - 50
const truncatedFacility = doc.splitTextToSize(facilityText, maxFacilityWidth)[0]
doc.text(truncatedFacility, col1Value, infoY)

doc.setFont('helvetica', 'bold')
doc.text('Versione:', col2Label, infoY)
doc.setFont('helvetica', 'normal')
doc.text('1.0', col2Value, infoY)

infoY += 10
doc.setFont('helvetica', 'bold')
doc.text('Stato:', col1Label, infoY)
doc.setFont('helvetica', 'normal')
doc.text(statusMap[assessment.status] || assessment.status, col1Value, infoY)

infoY += 10
doc.setFont('helvetica', 'bold')
doc.text('Data Assessment:', col1Label, infoY)
doc.setFont('helvetica', 'normal')
doc.text(new Date(assessment.created_at).toLocaleDateString('it-IT'), col1Value, infoY)


doc.setFont('helvetica', 'bold')
doc.text('Data Report:', col2Label, infoY)
doc.setFont('helvetica', 'normal')
doc.text(new Date().toLocaleDateString('it-IT'), col2Value, infoY)

infoY += 10
doc.setFont('helvetica', 'bold')
doc.text('Redatto da:____________________', col1Label, infoY)
doc.setFont('helvetica', 'normal')


doc.setFont('helvetica', 'bold')
doc.text('Approvato da:_____________________', col2Label, infoY)
doc.setFont('helvetica', 'normal')



  // Statistiche rapide
  const statsY = 185
  doc.setFillColor(254, 242, 242) // red-50
  doc.roundedRect(margin, statsY, 55, 35, 2, 2, 'F')
  doc.setFillColor(254, 249, 195) // yellow-50
  doc.roundedRect(margin + 60, statsY, 55, 35, 2, 2, 'F')
  doc.setFillColor(220, 252, 231) // green-50
  doc.roundedRect(margin + 120, statsY, 55, 35, 2, 2, 'F')
  
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(220, 38, 38) // red-600
  doc.text(String(highRisks.length), margin + 27, statsY + 18, { align: 'center' })
  doc.setTextColor(202, 138, 4) // yellow-600
  doc.text(String(mediumRisks.length), margin + 87, statsY + 18, { align: 'center' })
  doc.setTextColor(22, 163, 74) // green-600
  doc.text(String(lowRisks.length), margin + 147, statsY + 18, { align: 'center' })
  
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.setFont('helvetica', 'normal')
  doc.text('Rischio Alto', margin + 27, statsY + 28, { align: 'center' })
  doc.text('Rischio Medio', margin + 87, statsY + 28, { align: 'center' })
  doc.text('Rischio Basso', margin + 147, statsY + 28, { align: 'center' })

  // Footer copertina
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text('PhaRMA T', pageWidth / 2, 250, { align: 'center' })
  doc.setFontSize(8)
  doc.text('Pharmacy Risk Management Assessment Tool', pageWidth / 2, 256, { align: 'center' })
  doc.text('Sviluppato da Dott. Daniele Leonardi Vinci', pageWidth / 2, 262, { align: 'center' })

  // ============================================
  // PAGINA 2 - EXECUTIVE SUMMARY
  // ============================================
  doc.addPage()
  
  doc.setFillColor(30, 58, 100)
  doc.rect(0, 0, pageWidth, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('EXECUTIVE SUMMARY', margin, 13)
  
  let y = 35
  
  // Panoramica
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Panoramica', margin, y)
  
  y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(55, 65, 81)
  
  const overviewItems = [
    `• ${riskItems.length} rischi identificati in ${Object.keys(areaStats).length} aree`,
    `• ${highRisks.length} rischi ad alta priorità (${riskItems.length > 0 ? Math.round(highRisks.length / riskItems.length * 100) : 0}%)`,
    `• ${actions.length} azioni correttive pianificate`,
    `• ${completedActions.length} azioni completate (${actions.length > 0 ? Math.round(completedActions.length / actions.length * 100) : 0}%)`
  ]
  
  overviewItems.forEach(item => {
    doc.text(item, margin + 5, y)
    y += 7
  })
  
  // Indicatori chiave
  y += 8
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text('Indicatori Chiave', margin, y)
  
  y += 5
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 30, 2, 2, 'F')
  
  y += 12
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(55, 65, 81)
  
  const col1 = margin + 10
  const col2 = margin + 55
  const col3 = margin + 100
  const col4 = margin + 145
  
  doc.setFont('helvetica', 'bold')
  doc.text('RPN Totale:', col1, y)
  doc.setFont('helvetica', 'normal')
  doc.text(String(totalRPN), col1 + 28, y)
  
  doc.setFont('helvetica', 'bold')
  doc.text('RPN Medio:', col2, y)
  doc.setFont('helvetica', 'normal')
  doc.text(String(avgRPN), col2 + 27, y)
  
  doc.setFont('helvetica', 'bold')
  doc.text('% Con azioni:', col3, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${riskItems.length > 0 ? Math.round(risksWithActions.length / riskItems.length * 100) : 0}%`, col3 + 32, y)
  
  doc.setFont('helvetica', 'bold')
  doc.text('Rischi totali:', col4, y)
  doc.setFont('helvetica', 'normal')
  doc.text(String(riskItems.length), col4 + 30, y)
  
  // Aree Critiche
  y += 28
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text('Aree Critiche (Top 3 per RPN Medio)', margin, y)
  
  y += 5
  
  if (topAreas.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['#', 'Area', 'Rischi', 'RPN Medio', 'Rischi Alta']],
      body: topAreas.map((area, index) => [
        index + 1,
        area.area,
        area.count,
        area.avgRPN,
        area.highCount
      ]),
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: margin, right: margin }
    })
  }
  
  // Distribuzione del rischio
  y = (doc as any).lastAutoTable?.finalY + 15 || y + 50
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text('Distribuzione del Rischio', margin, y)
  
  y += 10
  const barWidth = 150
  const barHeight = 20
  const totalRisks = riskItems.length || 1
  
  const highWidth = (highRisks.length / totalRisks) * barWidth
  const mediumWidth = (mediumRisks.length / totalRisks) * barWidth
  const lowWidth = (lowRisks.length / totalRisks) * barWidth
  
  // Barra
  let barX = margin
  if (highWidth > 0) {
    doc.setFillColor(239, 68, 68) // red-500
    doc.rect(barX, y, highWidth, barHeight, 'F')
    barX += highWidth
  }
  if (mediumWidth > 0) {
    doc.setFillColor(234, 179, 8) // yellow-500
    doc.rect(barX, y, mediumWidth, barHeight, 'F')
    barX += mediumWidth
  }
  if (lowWidth > 0) {
    doc.setFillColor(34, 197, 94) // green-500
    doc.rect(barX, y, lowWidth, barHeight, 'F')
  }
  
  // Legenda
  y += barHeight + 10
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  doc.setFillColor(239, 68, 68)
  doc.rect(margin, y, 8, 8, 'F')
  doc.setTextColor(55, 65, 81)
  doc.text(`Alta: ${highRisks.length} (${Math.round(highRisks.length / totalRisks * 100)}%)`, margin + 12, y + 6)
  
  doc.setFillColor(234, 179, 8)
  doc.rect(margin + 60, y, 8, 8, 'F')
  doc.text(`Media: ${mediumRisks.length} (${Math.round(mediumRisks.length / totalRisks * 100)}%)`, margin + 72, y + 6)
  
  doc.setFillColor(34, 197, 94)
  doc.rect(margin + 130, y, 8, 8, 'F')
  doc.text(`Bassa: ${lowRisks.length} (${Math.round(lowRisks.length / totalRisks * 100)}%)`, margin + 142, y + 6)

  // ============================================
  // PAGINA 3 - METODOLOGIA E LEGENDA
  // ============================================
  doc.addPage()
  
  doc.setFillColor(30, 58, 100)
  doc.rect(0, 0, pageWidth, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('METODOLOGIA FMEA', margin, 13)
  
  y = 35
  
  // Introduzione
  doc.setTextColor(55, 65, 81)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const introText = "L'analisi FMEA (Failure Mode and Effects Analysis) è una metodologia sistematica per identificare e valutare i potenziali modi di guasto di un processo. Ogni rischio viene valutato secondo tre parametri: Severità (S), Probabilità (P) e Rilevabilità (D)."
  const introLines = doc.splitTextToSize(introText, pageWidth - margin * 2)
  doc.text(introLines, margin, y)
  
  y += introLines.length * 5 + 10
  
  // Scala Severità
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text('Scala di Severità (S) - Gravità delle conseguenze', margin, y)
  
  y += 5
  autoTable(doc, {
    startY: y,
    head: [['Valore', 'Livello', 'Descrizione']],
    body: [
      ['1', 'Minima', 'Nessun danno o danno trascurabile'],
      ['2', 'Bassa', 'Danno lieve, recuperabile senza intervento'],
      ['3', 'Moderata', 'Danno moderato, richiede intervento'],
      ['4', 'Alta', 'Danno grave, potenziale pericolo'],
      ['5', 'Catastrofica', 'Danno irreversibile, (es. pericolo di vita)']
    ],
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 130 }
    },
    margin: { left: margin, right: margin }
  })
  
  y = (doc as any).lastAutoTable.finalY + 10
  
  // Scala Probabilità
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text('Scala di Probabilità (P) - Frequenza di accadimento', margin, y)
  
  y += 5
  autoTable(doc, {
    startY: y,
    head: [['Valore', 'Livello', 'Descrizione']],
    body: [
      ['1', 'Rara', 'Evento eccezionale (es. < 1/anno)'],
      ['2', 'Improbabile', 'Evento raro (es. 1-2/anno)'],
      ['3', 'Occasionale', 'Evento occasionale (es. mensile)'],
      ['4', 'Probabile', 'Evento frequente (es. settimanale)'],
      ['5', 'Frequente', 'Evento molto frequente (es. giornaliero)']
    ],
    theme: 'striped',
    headStyles: { fillColor: [234, 179, 8], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 130 }
    },
    margin: { left: margin, right: margin }
  })
  
  y = (doc as any).lastAutoTable.finalY + 10
  
  // Scala Rilevabilità
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text('Scala di Rilevabilità (D) - Capacità di individuare il rischio', margin, y)
  
  y += 5
  autoTable(doc, {
    startY: y,
    head: [['Valore', 'Livello', 'Descrizione']],
    body: [
      ['1', 'Certa', 'Rilevazione automatica e sicura'],
      ['2', 'Alta', 'Rilevazione molto probabile'],
      ['3', 'Moderata', 'Rilevazione possibile con controlli'],
      ['4', 'Bassa', 'Rilevazione difficile'],
      ['5', 'Nulla', 'Rilevazione quasi impossibile']
    ],
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 130 }
    },
    margin: { left: margin, right: margin }
  })
  
  y = (doc as any).lastAutoTable.finalY + 10
  
  // Classificazione RPN
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text('Classificazione RPN (Risk Priority Number)', margin, y)
  
  y += 5
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(55, 65, 81)
  doc.text('RPN = Severità × Probabilità × Rilevabilità (range 1-125)', margin, y + 5)
  
  y += 12
  autoTable(doc, {
    startY: y,
    head: [['Range RPN', 'Classe', 'Azione Richiesta']],
    body: [
      ['>= 50', 'ALTA', 'Richiesta azione correttiva immediata '],
      ['20 - 49', 'MEDIA', 'Azione correttiva programmata'],
      ['< 20', 'BASSA', 'Monitoraggio e rivalutazione periodica']
    ],
    theme: 'grid',
    headStyles: { fillColor: [75, 85, 99], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 120 }
    },
    margin: { left: margin, right: margin },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 1) {
        if (data.cell.raw === 'ALTA') {
          data.cell.styles.fillColor = [254, 226, 226]
          data.cell.styles.textColor = [185, 28, 28]
          data.cell.styles.fontStyle = 'bold'
        } else if (data.cell.raw === 'MEDIA') {
          data.cell.styles.fillColor = [254, 249, 195]
          data.cell.styles.textColor = [161, 98, 7]
          data.cell.styles.fontStyle = 'bold'
        } else if (data.cell.raw === 'BASSA') {
          data.cell.styles.fillColor = [220, 252, 231]
          data.cell.styles.textColor = [21, 128, 61]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    }
  })

  // ============================================
  // PAGINE 4+ - RISCHI PER CATEGORIA
  // ============================================
  doc.addPage()
  
  doc.setFillColor(30, 58, 100)
  doc.rect(0, 0, pageWidth, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DETTAGLIO RISCHI IDENTIFICATI', margin, 13)
  
  y = 30

  // Ordina categorie
  const sortedCategories = Object.entries(risksByCategory).sort((a, b) => {
    const maxRpnA = Math.max(...a[1].map(r => r.rpn || 0))
    const maxRpnB = Math.max(...b[1].map(r => r.rpn || 0))
    return maxRpnB - maxRpnA
  })

  sortedCategories.forEach(([category, risks]) => {
    // Calcola statistiche categoria
    const catTotalRPN = risks.reduce((sum, r) => sum + (r.rpn || 0), 0)
    const catAvgRPN = Math.round(catTotalRPN / risks.length)
    const catHighCount = risks.filter(r => r.risk_class === 'Alta').length
    
    // Ordina rischi per RPN decrescente
    const sortedRisks = [...risks].sort((a, b) => (b.rpn || 0) - (a.rpn || 0))
    
    // Check se serve nuova pagina
    if (y > 230) {
      doc.addPage()
      doc.setFillColor(30, 58, 100)
      doc.rect(0, 0, pageWidth, 20, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('DETTAGLIO RISCHI IDENTIFICATI (continua)', margin, 13)
      y = 30
    }
    
    // Header categoria
    doc.setFillColor(241, 245, 249) // slate-100
    doc.roundedRect(margin, y, pageWidth - margin * 2, 12, 2, 2, 'F')
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text(`${category} (${risks.length} rischi)`, margin + 5, y + 8)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text(`RPN Medio: ${catAvgRPN} | Alta: ${catHighCount}`, pageWidth - margin - 50, y + 8)
    
    y += 15
    
    // Tabella rischi
    const tableData = sortedRisks.map((risk, index) => {
      const riskActions = actions.filter(a => a.risk_item_id === risk.id)
      const actionText = riskActions.length > 0 
        ? riskActions.map(a => `• ${a.description?.substring(0, 35)}${(a.description?.length || 0) > 35 ? '...' : ''}`).join('\n')
        : '-'
      
      return [
        index + 1,
        risk.risk_catalog_base?.name || risk.custom_risk_name || '',
        risk.severity || '-',
        risk.probability || '-',
        risk.detectability || '-',
        risk.rpn || '-',
        risk.risk_class || 'N/D',
        actionText
      ]
    })
    
    autoTable(doc, {
      startY: y,
      head: [['#', 'Rischio', 'S', 'P', 'D', 'RPN', 'Classe', 'Azioni Correttive']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [14, 165, 233],
        fontSize: 8,
        cellPadding: 2
      },
      bodyStyles: { 
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 10, halign: 'center' },
        3: { cellWidth: 10, halign: 'center' },
        4: { cellWidth: 10, halign: 'center' },
        5: { cellWidth: 12, halign: 'center' },
        6: { cellWidth: 18, halign: 'center' },
        7: { cellWidth: 55 }
      },
      margin: { left: margin, right: margin },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 6) {
          const value = data.cell.raw
          if (value === 'Alta') {
            data.cell.styles.fillColor = [254, 226, 226]
            data.cell.styles.textColor = [185, 28, 28]
            data.cell.styles.fontStyle = 'bold'
          } else if (value === 'Media') {
            data.cell.styles.fillColor = [254, 249, 195]
            data.cell.styles.textColor = [161, 98, 7]
          } else if (value === 'Bassa') {
            data.cell.styles.fillColor = [220, 252, 231]
            data.cell.styles.textColor = [21, 128, 61]
          }
        }
      }
    })
    
    y = (doc as any).lastAutoTable.finalY + 10
  })

  // ============================================
  // PAGINA - ANALISI DI PARETO
  // ============================================
  doc.addPage()
  
  doc.setFillColor(30, 58, 100)
  doc.rect(0, 0, pageWidth, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('ANALISI DI PARETO', margin, 13)
  
  y = 35
  
  // Calcolo Pareto
  const sortedByRpn = [...riskItems]
    .filter(r => r.rpn && r.rpn > 0)
    .sort((a, b) => (b.rpn || 0) - (a.rpn || 0))
  
  const paretoRisks: Array<{ risk: RiskItem; cumulativePercent: number }> = []
  let cumulative = 0
  
  sortedByRpn.forEach(risk => {
    cumulative += risk.rpn || 0
    const cumulativePercent = Math.round((cumulative / totalRPN) * 100)
    if (paretoRisks.length === 0 || paretoRisks[paretoRisks.length - 1].cumulativePercent < paretoThreshold) {
      paretoRisks.push({ risk, cumulativePercent })
    } else if (paretoRisks[paretoRisks.length - 1].cumulativePercent < paretoThreshold + 10) {
      paretoRisks.push({ risk, cumulativePercent })
    }
  })
  
  // Descrizione
  doc.setTextColor(55, 65, 81)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const paretoText = `Il principio di Pareto indica che circa l'80% degli effetti deriva dal 20% delle cause. In questo assessment, ${paretoRisks.length} rischi su ${riskItems.length} (${Math.round(paretoRisks.length / riskItems.length * 100)}%) spiegano il ${paretoThreshold}% del rischio totale.`
  const paretoLines = doc.splitTextToSize(paretoText, pageWidth - margin * 2)
  doc.text(paretoLines, margin, y)
  
  y += paretoLines.length * 5 + 10
  
  // Box riepilogo
  doc.setFillColor(254, 243, 199) // amber-100
  doc.roundedRect(margin, y, pageWidth - margin * 2, 15, 2, 2, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(161, 98, 7) // amber-700
  doc.text(`Concentrando le azioni sui primi ${paretoRisks.length} rischi si ottiene il massimo impatto.`, margin + 5, y + 10)
  
  y += 25
  
  // Tabella Pareto
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(`Rischi Prioritari (Top ${paretoThreshold}%)`, margin, y)
  
  y += 5
  
  const paretoTableData = paretoRisks.map((item, index) => {
    const hasActions = actions.some(a => a.risk_item_id === item.risk.id)
    return [
      index + 1,
      item.risk.risk_catalog_base?.name || item.risk.custom_risk_name || '',
      item.risk.risk_catalog_base?.category || 'Altro',
      item.risk.rpn || '-',
      `${item.cumulativePercent}%`,
      item.risk.risk_class || 'N/D',
      hasActions ? 'Sì' : 'No'
    ]
  })
  
  autoTable(doc, {
    startY: y,
    head: [['#', 'Rischio', 'Categoria', 'RPN', '% Cum.', 'Classe', 'Azioni']],
    body: paretoTableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [245, 158, 11], // amber-500
      fontSize: 9
    },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 40 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' }
    },
    margin: { left: margin, right: margin },
    didParseCell: function(data) {
      if (data.section === 'body') {
        // Colonna Classe
        if (data.column.index === 5) {
          const value = data.cell.raw
          if (value === 'Alta') {
            data.cell.styles.fillColor = [254, 226, 226]
            data.cell.styles.textColor = [185, 28, 28]
            data.cell.styles.fontStyle = 'bold'
          } else if (value === 'Media') {
            data.cell.styles.fillColor = [254, 249, 195]
            data.cell.styles.textColor = [161, 98, 7]
          } else if (value === 'Bassa') {
            data.cell.styles.fillColor = [220, 252, 231]
            data.cell.styles.textColor = [21, 128, 61]
          }
        }
        // Colonna Azioni
        if (data.column.index === 6) {
          if (data.cell.raw === 'Sì') {
            data.cell.styles.fillColor = [220, 252, 231]
            data.cell.styles.textColor = [21, 128, 61]
          } else {
            data.cell.styles.fillColor = [254, 226, 226]
            data.cell.styles.textColor = [185, 28, 28]
          }
        }
      }
    }
  })

  // ============================================
  // ULTIMA PAGINA - RACCOMANDAZIONI E PIANO D'AZIONE
  // ============================================
  doc.addPage()
  
  doc.setFillColor(30, 58, 100)
  doc.rect(0, 0, pageWidth, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RACCOMANDAZIONI E PIANO D\'AZIONE', margin, 13)
  
  y = 35
  
  // Azioni Correttive Pianificate
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text('Azioni Correttive Pianificate', margin, y)
  
  y += 8
  
  // Trova rischi con azioni
  const risksWithActionsList = riskItems.filter(r => 
    actions.some(a => a.risk_item_id === r.id)
  ).map(r => ({
    risk: r,
    riskActions: actions.filter(a => a.risk_item_id === r.id)
  }))
  
  if (risksWithActionsList.length > 0) {
    const actionTableData: any[][] = []
    
    risksWithActionsList.forEach((item) => {
      item.riskActions.forEach((action) => {
        actionTableData.push([
          item.risk.risk_catalog_base?.name || item.risk.custom_risk_name || '',
          item.risk.rpn || '-',
          item.risk.risk_class || 'N/D',
          action.description || '',
          action.responsible || '-',
          action.due_date ? new Date(action.due_date).toLocaleDateString('it-IT') : '-',
          action.status === 'completed' ? 'Completata' : action.status === 'in_progress' ? 'In corso' : 'Pianificata'
        ])
      })
    })
    
    autoTable(doc, {
      startY: y,
      head: [['Rischio', 'RPN', 'Classe', 'Azione Correttiva', 'Responsabile', 'Scadenza', 'Stato']],
      body: actionTableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [34, 197, 94], // green-500
        fontSize: 8
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 50 },
        4: { cellWidth: 25 },
        5: { cellWidth: 22 },
        6: { cellWidth: 20, halign: 'center' }
      },
      margin: { left: margin, right: margin },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 6) {
          const value = data.cell.raw
          if (value === 'Completata') {
            data.cell.styles.fillColor = [220, 252, 231]
            data.cell.styles.textColor = [21, 128, 61]
          } else if (value === 'In corso') {
            data.cell.styles.fillColor = [254, 249, 195]
            data.cell.styles.textColor = [161, 98, 7]
          } else {
            data.cell.styles.fillColor = [219, 234, 254]
            data.cell.styles.textColor = [29, 78, 216]
          }
        }
      }
    })
    
    y = (doc as any).lastAutoTable.finalY + 15
  } else {
    doc.setFillColor(254, 249, 195) // yellow-100
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(161, 98, 7)
    doc.text('Nessuna azione correttiva è stata ancora pianificata per questo assessment.', margin + 5, y + 12)
    y += 30
  }
  
  // Piano di Monitoraggio
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text('Piano di Monitoraggio', margin, y)
  
  y += 8
  doc.setFillColor(249, 250, 251) // gray-50
  doc.roundedRect(margin, y, pageWidth - margin * 2, 45, 2, 2, 'F')
  doc.setDrawColor(229, 231, 235)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 45, 2, 2, 'S')
  
  y += 12
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)
  doc.text('Data rivalutazione:', margin + 10, y)
  doc.setFont('helvetica', 'normal')
  doc.text('_________________________________', margin + 45, y)
  
  y += 12
  doc.setFont('helvetica', 'bold')
  doc.text('Responsabile:', margin + 10, y)
  doc.setFont('helvetica', 'normal')
  doc.text('_________________________________', margin + 40, y)
  
  y += 12
  doc.setFont('helvetica', 'bold')
  doc.text('Frequenza audit:', margin + 10, y)
  doc.setFont('helvetica', 'normal')
  doc.text('_________________________________', margin + 43, y)
  
  // Firma
  y += 30
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth / 2 - 10, y)
  doc.line(pageWidth / 2 + 10, y, pageWidth - margin, y)
  
  y += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('Firma Responsabile', margin + 25, y)
  doc.text('Data', pageWidth / 2 + 40, y)

  // ============================================
  // FOOTER SU TUTTE LE PAGINE
  // ============================================
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175) // gray-400
    doc.text(
      `Pagina ${i} di ${pageCount} - PhaRMA T - Sviluppato da Dott. Daniele Leonardi Vinci`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  // Salva
  const fileName = `${assessment.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

export const exportToExcel = ({ assessment, riskItems, actions = [] }: ExportData) => {
  // Foglio 1: Info Assessment
  const infoData = [
    ['RISK ASSESSMENT REPORT'],
    [''],
    ['Titolo', assessment.title],
    ['Descrizione', assessment.description || ''],
    ['Stato', assessment.status === 'draft' ? 'Bozza' : assessment.status === 'in_progress' ? 'In Corso' : 'Completato'],
    ['Data Creazione', new Date(assessment.created_at).toLocaleDateString('it-IT')],
    ['Data Export', new Date().toLocaleDateString('it-IT')],
    [''],
    ['STATISTICHE'],
    ['Rischi Totali', riskItems.length],
    ['Rischi Alta Priorità', riskItems.filter(r => r.risk_class === 'Alta').length],
    ['Rischi Media Priorità', riskItems.filter(r => r.risk_class === 'Media').length],
    ['Rischi Bassa Priorità', riskItems.filter(r => r.risk_class === 'Bassa').length],
    ['RPN Totale', riskItems.reduce((sum, r) => sum + (r.rpn || 0), 0)],
    ['RPN Medio', riskItems.length > 0 ? Math.round(riskItems.reduce((sum, r) => sum + (r.rpn || 0), 0) / riskItems.length) : 0],
    [''],
    ['AZIONI CORRETTIVE'],
    ['Azioni Totali', actions.length],
    ['Azioni Completate', actions.filter(a => a.status === 'completed').length],
    ['Azioni In Corso', actions.filter(a => a.status === 'in_progress').length],
    ['Azioni Pianificate', actions.filter(a => a.status === 'planned').length],
  ]
  
  // Foglio 2: Dettaglio Rischi
  const risksData = [
    ['#', 'Rischio', 'Categoria', 'Area', 'Sotto-area', 'Severità', 'Probabilità', 'Rilevabilità', 'RPN', 'Classe', 'Azioni Correttive']
  ]
  
  riskItems
    .sort((a, b) => (b.rpn || 0) - (a.rpn || 0))
    .forEach((risk, index) => {
      const { area, subArea } = parseCategory(risk.risk_catalog_base?.category || 'Altro')
      const riskActions = actions.filter(a => a.risk_item_id === risk.id)
      risksData.push([
        String(index + 1),
        risk.risk_catalog_base?.name || risk.custom_risk_name || '',
        risk.risk_catalog_base?.category || 'Altro',
        area,
        subArea || '',
        String(risk.severity || ''),
        String(risk.probability || ''),
        String(risk.detectability || ''),
        String(risk.rpn || ''),
        risk.risk_class || '',
        riskActions.map(a => a.description).join('; ') || ''
      ])
    })
  
  // Foglio 3: Azioni Correttive
  const actionsData = [
    ['Rischio', 'RPN', 'Classe', 'Azione Correttiva', 'Responsabile', 'Scadenza', 'Stato', 'Note']
  ]
  
  actions.forEach(action => {
    const risk = riskItems.find(r => r.id === action.risk_item_id)
    actionsData.push([
      risk?.risk_catalog_base?.name || risk?.custom_risk_name || '',
      String(risk?.rpn || ''),
      risk?.risk_class || '',
      action.description || '',
      action.responsible || '',
      action.due_date ? new Date(action.due_date).toLocaleDateString('it-IT') : '',
      action.status === 'completed' ? 'Completata' : action.status === 'in_progress' ? 'In corso' : 'Pianificata',
      action.notes || ''
    ])
  })
  
  // Crea workbook
  const wb = XLSX.utils.book_new()
  
  const ws1 = XLSX.utils.aoa_to_sheet(infoData)
  ws1['!cols'] = [{ wch: 25 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Info')
  
  const ws2 = XLSX.utils.aoa_to_sheet(risksData)
  ws2['!cols'] = [
    { wch: 5 }, { wch: 40 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
    { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 40 }
  ]
  XLSX.utils.book_append_sheet(wb, ws2, 'Rischi')
  
  const ws3 = XLSX.utils.aoa_to_sheet(actionsData)
  ws3['!cols'] = [
    { wch: 35 }, { wch: 8 }, { wch: 10 }, { wch: 40 },
    { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 30 }
  ]
  XLSX.utils.book_append_sheet(wb, ws3, 'Azioni Correttive')
  
  // Salva
  const fileName = `${assessment.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}
