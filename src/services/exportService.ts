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
  matrixImage?: string
  paretoImage?: string
}

export const exportToPDF = ({ assessment, riskItems, facilityName, actions = [], paretoThreshold = 80, matrixImage, paretoImage }: ExportData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // ============ PAGINA 1: COPERTINA E RIEPILOGO ============
  
  // Header
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  if (facilityName) {
    doc.text(facilityName, 14, 15)
  }
  doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, pageWidth - 14, 15, { align: 'right' })

  // Logo/Title
  doc.setFontSize(24)
  doc.setTextColor(14, 165, 233) // sky-500
  doc.text('PhaRMA T', 14, 35)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Pharmacy Risk Management Assessment Tool', 14, 42)

  // Assessment Title
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text(assessment.title, 14, 60)

  if (assessment.description) {
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    const descLines = doc.splitTextToSize(assessment.description, pageWidth - 28)
    doc.text(descLines, 14, 70)
  }

  // Statistiche Box
  const statsY = assessment.description ? 85 : 75
  
  const stats = {
    total: riskItems.length,
    high: riskItems.filter(r => r.risk_class === 'Alta').length,
    medium: riskItems.filter(r => r.risk_class === 'Media').length,
    low: riskItems.filter(r => r.risk_class === 'Bassa').length,
    withActions: riskItems.filter(r => actions.some(a => a.risk_item_id === r.id)).length,
    actionsTotal: actions.length,
    actionsCompleted: actions.filter(a => a.status === 'completed').length,
  }

  // Box statistiche
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, statsY, pageWidth - 28, 45, 3, 3, 'F')
  
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.text('Riepilogo Assessment', 20, statsY + 10)
  
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  
  // Colonna 1
  doc.text(`Rischi totali: ${stats.total}`, 20, statsY + 22)
  doc.text(`Rischi con azioni: ${stats.withActions}`, 20, statsY + 30)
  doc.text(`Azioni totali: ${stats.actionsTotal}`, 20, statsY + 38)
  
  // Colonna 2
  doc.setTextColor(220, 38, 38) // red
  doc.text(`Alto: ${stats.high}`, 80, statsY + 22)
  doc.setTextColor(234, 179, 8) // yellow
  doc.text(`Medio: ${stats.medium}`, 80, statsY + 30)
  doc.setTextColor(34, 197, 94) // green
  doc.text(`Basso: ${stats.low}`, 80, statsY + 38)
  
  // Colonna 3
  doc.setTextColor(80, 80, 80)
  const completionRate = stats.actionsTotal > 0 ? Math.round((stats.actionsCompleted / stats.actionsTotal) * 100) : 0
  doc.text(`Azioni completate: ${stats.actionsCompleted}/${stats.actionsTotal} (${completionRate}%)`, 130, statsY + 22)
  doc.text(`Stato: ${assessment.status === 'completed' ? 'Completato' : assessment.status === 'in_progress' ? 'In Corso' : 'Bozza'}`, 130, statsY + 30)

  // ============ PAGINA 2+: TABELLA RISCHI PER CATEGORIA ============
  
  doc.addPage()
  
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Rischi Identificati per Categoria', 14, 20)
  
  // Raggruppa per categoria
  const risksByCategory: Record<string, RiskItem[]> = {}
  riskItems.forEach(item => {
    const cat = item.risk_catalog_base?.category || 'Altro'
    if (!risksByCategory[cat]) risksByCategory[cat] = []
    risksByCategory[cat].push(item)
  })

  // Ordina per RPN decrescente in ogni categoria
  Object.keys(risksByCategory).forEach(cat => {
    risksByCategory[cat].sort((a, b) => (b.rpn || 0) - (a.rpn || 0))
  })

  let currentY = 30

  Object.entries(risksByCategory).forEach(([category, risks]) => {
    // Controlla se c'è spazio, altrimenti nuova pagina
    if (currentY > 250) {
      doc.addPage()
      currentY = 20
    }

    // Header categoria
    doc.setFontSize(11)
    doc.setTextColor(14, 165, 233)
    doc.text(`${category} (${risks.length} rischi)`, 14, currentY)
    currentY += 5

    const tableData = risks.map((item, index) => {
      const riskActions = actions.filter(a => a.risk_item_id === item.id)
      const actionsText = riskActions.length > 0 
        ? riskActions.map(a => `• ${a.description.substring(0, 40)}${a.description.length > 40 ? '...' : ''}`).join('\n')
        : '-'

      return [
        String(index + 1),
        item.risk_catalog_base?.name || item.custom_risk_name || 'N/D',
        item.severity?.toString() || '-',
        item.probability?.toString() || '-',
        item.detectability?.toString() || '-',
        item.rpn?.toString() || '-',
        item.risk_class || 'N/D',
        actionsText
      ]
    })

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Rischio', 'S', 'P', 'D', 'RPN', 'Classe', 'Azioni Correttive']],
      body: tableData,
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 45 },
        2: { halign: 'center', cellWidth: 10 },
        3: { halign: 'center', cellWidth: 10 },
        4: { halign: 'center', cellWidth: 10 },
        5: { halign: 'center', cellWidth: 12 },
        6: { halign: 'center', cellWidth: 15 },
        7: { cellWidth: 55 }
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          const value = data.cell.raw as string
          if (value === 'Alta') {
            data.cell.styles.fillColor = [254, 202, 202]
            data.cell.styles.textColor = [185, 28, 28]
          } else if (value === 'Media') {
            data.cell.styles.fillColor = [254, 240, 138]
            data.cell.styles.textColor = [161, 98, 7]
          } else if (value === 'Bassa') {
            data.cell.styles.fillColor = [187, 247, 208]
            data.cell.styles.textColor = [21, 128, 61]
          }
          data.cell.styles.fontStyle = 'bold'
        }
      },
      margin: { left: 14, right: 14 }
    })

    currentY = (doc as any).lastAutoTable.finalY + 10
  })

  // ============ PAGINA: GRAFICI ============
  
  if (matrixImage || paretoImage) {
    doc.addPage()
    
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Rappresentazione Grafica del Rischio', 14, 20)

    let imageY = 30

    // Matrice del rischio
    if (matrixImage) {
      doc.setFontSize(11)
      doc.setTextColor(80, 80, 80)
      doc.text('Matrice del Rischio 5x5', 14, imageY)
      imageY += 5
      
      try {
        doc.addImage(matrixImage, 'PNG', 14, imageY, 85, 70)
      } catch (err) {
        console.error('Errore aggiunta matrice:', err)
      }
      imageY += 75
    }

    // Grafico Pareto
    if (paretoImage) {
      // Se non c'è spazio, nuova pagina
      if (imageY > 180) {
        doc.addPage()
        imageY = 20
      }
      
      doc.setFontSize(11)
      doc.setTextColor(80, 80, 80)
      doc.text('Analisi di Pareto', 14, imageY)
      imageY += 5
      
      try {
        doc.addImage(paretoImage, 'PNG', 14, imageY, 180, 80)
      } catch (err) {
        console.error('Errore aggiunta Pareto:', err)
      }
    }
  }
  // ============ PAGINA: ANALISI DI PARETO ============
  
  doc.addPage()
  
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text(`Analisi di Pareto - Rischi che spiegano il ${paretoThreshold}% del rischio totale`, 14, 20)

  // Calcola Pareto
  const sortedByRpn = [...riskItems]
    .filter(r => r.rpn && r.rpn > 0)
    .sort((a, b) => (b.rpn || 0) - (a.rpn || 0))
  
  const totalRPN = sortedByRpn.reduce((sum, r) => sum + (r.rpn || 0), 0)
  
  let cumulative = 0
  const paretoRisks: (RiskItem & { cumulativePercent: number })[] = []
  
  for (const risk of sortedByRpn) {
    cumulative += (risk.rpn || 0)
    const cumulativePercent = Math.round((cumulative / totalRPN) * 100)
    paretoRisks.push({ ...risk, cumulativePercent })
    if (cumulativePercent >= paretoThreshold) break
  }

  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`${paretoRisks.length} rischi su ${riskItems.length} (${Math.round((paretoRisks.length / riskItems.length) * 100)}%) spiegano il ${paretoThreshold}% del rischio totale.`, 14, 30)

  const paretoTableData = paretoRisks.map((item, index) => {
    const riskActions = actions.filter(a => a.risk_item_id === item.id)
    return [
      String(index + 1),
      item.risk_catalog_base?.name || item.custom_risk_name || 'N/D',
      item.risk_catalog_base?.category || '-',
      item.rpn?.toString() || '-',
      `${item.cumulativePercent}%`,
      item.risk_class || 'N/D',
      riskActions.length > 0 ? 'Sì' : 'No'
    ]
  })

  autoTable(doc, {
    startY: 38,
    head: [['#', 'Rischio', 'Categoria', 'RPN', '% Cum.', 'Classe', 'Ha Azioni']],
    body: paretoTableData,
    headStyles: {
      fillColor: [249, 115, 22], // orange-500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 35 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 18 }
    },
    bodyStyles: {
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [255, 247, 237] // orange-50
    },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === 'body') {
        const value = data.cell.raw as string
        if (value === 'Alta') {
          data.cell.styles.fillColor = [254, 202, 202]
          data.cell.styles.textColor = [185, 28, 28]
        } else if (value === 'Media') {
          data.cell.styles.fillColor = [254, 240, 138]
          data.cell.styles.textColor = [161, 98, 7]
        } else if (value === 'Bassa') {
          data.cell.styles.fillColor = [187, 247, 208]
          data.cell.styles.textColor = [21, 128, 61]
        }
        data.cell.styles.fontStyle = 'bold'
      }
      if (data.column.index === 6 && data.section === 'body') {
        const value = data.cell.raw as string
        if (value === 'Sì') {
          data.cell.styles.fillColor = [187, 247, 208]
          data.cell.styles.textColor = [21, 128, 61]
        } else {
          data.cell.styles.fillColor = [254, 202, 202]
          data.cell.styles.textColor = [185, 28, 28]
        }
        data.cell.styles.fontStyle = 'bold'
      }
    },
    margin: { left: 14, right: 14 }
  })

  // ============ FOOTER SU TUTTE LE PAGINE ============
  
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Pagina ${i} di ${pageCount} - PhaRMA T - Sviluppato da Dott. Daniele Leonardi Vinci`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Download
  const fileName = `${assessment.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

export const exportToExcel = ({ assessment, riskItems, facilityName, actions = [] }: ExportData) => {
  // Foglio 1: Info
  const infoData = [
    ['PhaRMA T - Risk Assessment FMEA'],
    ['Sviluppato da Dott. Daniele Leonardi Vinci'],
    [''],
    ['Titolo:', assessment.title],
    ['Descrizione:', assessment.description || '-'],
    ['Struttura:', facilityName || '-'],
    ['Data creazione:', new Date(assessment.created_at).toLocaleDateString('it-IT')],
    ['Data export:', new Date().toLocaleDateString('it-IT')],
    ['Stato:', assessment.status === 'completed' ? 'Completato' : assessment.status === 'in_progress' ? 'In Corso' : 'Bozza'],
    [''],
    ['STATISTICHE RISCHI'],
    ['Rischi totali:', riskItems.length],
    ['Rischio Alto:', riskItems.filter(r => r.risk_class === 'Alta').length],
    ['Rischio Medio:', riskItems.filter(r => r.risk_class === 'Media').length],
    ['Rischio Basso:', riskItems.filter(r => r.risk_class === 'Bassa').length],
    [''],
    ['STATISTICHE AZIONI'],
    ['Azioni totali:', actions.length],
    ['Completate:', actions.filter(a => a.status === 'completed').length],
    ['In corso:', actions.filter(a => a.status === 'in_progress').length],
    ['Pianificate:', actions.filter(a => a.status === 'planned').length],
  ]
  
  const wsInfo = XLSX.utils.aoa_to_sheet(infoData)
  wsInfo['!cols'] = [{ wch: 25 }, { wch: 50 }]

  // Foglio 2: Rischi
  const riskData = riskItems.map((item, index) => {
    const riskActions = actions.filter(a => a.risk_item_id === item.id)
    const actionsText = riskActions.length > 0 
      ? riskActions.map(a => `${a.description} (${a.status === 'completed' ? 'Completata' : a.status === 'in_progress' ? 'In corso' : 'Pianificata'})`).join('; ')
      : '-'

    return {
      '#': index + 1,
      'Rischio': item.risk_catalog_base?.name || item.custom_risk_name || 'N/D',
      'Categoria': item.risk_catalog_base?.category || '-',
      'Severità (S)': item.severity || '-',
      'Probabilità (P)': item.probability || '-',
      'Rilevabilità (D)': item.detectability || '-',
      'RPN': item.rpn || '-',
      'Hazard Score': item.hazard_score || '-',
      'Classe Rischio': item.risk_class || 'N/D',
      'Azioni Correttive': actionsText,
      'Note': item.notes || ''
    }
  })

  const wsRisks = XLSX.utils.json_to_sheet(riskData)
  wsRisks['!cols'] = [
    { wch: 5 },
    { wch: 40 },
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 12 },
    { wch: 15 },
    { wch: 50 },
    { wch: 30 },
  ]

  // Foglio 3: Azioni
  const actionsData = actions.map((action, index) => {
    const risk = riskItems.find(r => r.id === action.risk_item_id)
    return {
      '#': index + 1,
      'Rischio Associato': risk?.risk_catalog_base?.name || risk?.custom_risk_name || 'N/D',
      'Descrizione Azione': action.description,
      'Responsabile': action.responsible || '-',
      'Data Scadenza': action.due_date ? new Date(action.due_date).toLocaleDateString('it-IT') : '-',
      'Stato': action.status === 'completed' ? 'Completata' : action.status === 'in_progress' ? 'In corso' : 'Pianificata',
      'Data Completamento': action.completion_date ? new Date(action.completion_date).toLocaleDateString('it-IT') : '-'
    }
  })

  const wsActions = XLSX.utils.json_to_sheet(actionsData)
  wsActions['!cols'] = [
    { wch: 5 },
    { wch: 40 },
    { wch: 50 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
  ]

  // Crea workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Info')
  XLSX.utils.book_append_sheet(wb, wsRisks, 'Rischi')
  XLSX.utils.book_append_sheet(wb, wsActions, 'Azioni Correttive')

  // Download
  const fileName = `${assessment.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}