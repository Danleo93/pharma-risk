import fs from 'node:fs'
import path from 'node:path'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { encode as encodePng } from 'fast-png'
import { ROOT, STATUS, writeResult } from './lib.mjs'

const OUTPUT_DIR = path.join(ROOT, 'tmp', 'security-pdf-regression')

const hostilePayloads = [
  '<script>alert(1)</script>',
  '<svg onload=alert(1)>',
  'javascript:alert(1)',
  '=1+1',
  '+SUM(A1:A2)',
]

const longText = `Testo lungo: ${'documentazione sintetica di controllo '.repeat(80)}`
const unicodeText = 'Qualita, conformita e responsabilita: e accenti à è ì ò ù; simboli Ω µ.'
const syntheticIshikawaPng = encodePng({
  width: 2,
  height: 2,
  channels: 4,
  depth: 8,
  data: new Uint8Array([
    14, 116, 144, 255, 14, 116, 144, 255,
    226, 232, 240, 255, 226, 232, 240, 255,
  ]),
})

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const results = []

function record(module, passed, details) {
  const result = { module, status: passed ? STATUS.PASS : STATUS.FAIL, details }
  results.push(result)
  console.log(`${result.status.padEnd(4)} ${module} - ${details}`)
}

function addTitle(doc, title, subtitle) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(title, 14, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(subtitle, 14, 26)
}

function validateAndWrite(module, doc) {
  const arrayBuffer = doc.output('arraybuffer')
  const bytes = Buffer.from(arrayBuffer)
  const raw = bytes.toString('latin1')
  const activeContent = /\/JavaScript\b|\/JS\s*\(|\/AA\s*<</.test(raw)
  const valid = raw.startsWith('%PDF-') && bytes.length > 1_000 && !activeContent
  const fileName = `${module.toLowerCase()}-regression.pdf`
  fs.writeFileSync(path.join(OUTPUT_DIR, fileName), bytes)
  record(
    module,
    valid,
    `${doc.getNumberOfPages()} pagine, ${bytes.length} byte, contenuto JavaScript attivo: ${activeContent ? 'SI' : 'NO'}`,
  )
}

function createFmeaPdf() {
  const doc = new jsPDF()
  addTitle(doc, 'Report FMEA - Assessment sintetico', unicodeText)
  autoTable(doc, {
    startY: 34,
    head: [['Assessment', 'Processo', 'Stato']],
    body: [['FMEA sicurezza terapia', 'Validazione prescrizione', 'In corso']],
  })
  autoTable(doc, {
    startY: 58,
    head: [['Rischio', 'S', 'P', 'R', 'RPN', 'Note e controlli']],
    body: [
      ['Errore sintetico di allestimento', 4, 3, 2, 24, `${unicodeText}\n${longText}`],
      ['Payload trattati come testo', 2, 2, 2, 8, hostilePayloads.join('\n')],
    ],
    styles: { fontSize: 8 },
  })
  doc.addPage()
  autoTable(doc, {
    head: [['Action plan', 'Responsabile', 'Scadenza', 'Stato']],
    body: [['Doppio controllo documentato', 'Team sintetico', '31/12/2026', 'Pianificata']],
  })
  validateAndWrite('FMEA', doc)
}

function createRcaPdf() {
  const doc = new jsPDF()
  addTitle(doc, 'Report RCA - Evento sintetico', unicodeText)
  autoTable(doc, {
    startY: 34,
    head: [['Evento', 'Descrizione', 'Monitoraggio']],
    body: [['Near miss sintetico', hostilePayloads.join(' | '), 'Rivalutazione prevista']],
  })
  autoTable(doc, {
    startY: 62,
    head: [['Causa Ishikawa', '5 Whys', 'Esito root cause']],
    body: [['Procedura non aggiornata', longText, 'Root Cause confermata']],
    styles: { fontSize: 8 },
  })
  doc.addPage('a4', 'landscape')
  doc.text('Diagramma Ishikawa sintetico', 14, 16)
  doc.addImage(syntheticIshikawaPng, 'PNG', 14, 24, 30, 30)
  doc.addPage('a4', 'portrait')
  autoTable(doc, {
    head: [['Azione', 'Responsabile / Firma', 'Stato']],
    body: [['Aggiornare procedura', 'Referente sintetico - Farmacista', 'In corso']],
  })
  validateAndWrite('RCA', doc)
}

function createGapPdf() {
  const doc = new jsPDF()
  addTitle(doc, 'Report Gap Analysis - Assessment sintetico', unicodeText)
  autoTable(doc, {
    startY: 34,
    head: [['Attivita/Requisito', 'Stato attuale', 'Target', 'Gap', 'Priorita']],
    body: [
      [
        'Controllo temperatura',
        'Registrazione giornaliera',
        'Monitoraggio continuo',
        `${longText}\n${hostilePayloads.join(' | ')}`,
        'Alta',
      ],
    ],
    styles: { fontSize: 8 },
  })
  doc.addPage()
  autoTable(doc, {
    head: [['Azione', 'Verifica efficacia', 'Riferimento normativo']],
    body: [['Installare data logger', 'Pending - verifica a 30 giorni', 'Norma sintetica, ambito UFA']],
  })
  validateAndWrite('Gap', doc)
}

function validateSourceUsage() {
  const sources = [
    'src/services/exportService.ts',
    'src/services/rcaExportService.ts',
    'src/services/gapExportService.ts',
  ]
  const forbiddenApis = [
    /\.addJS\s*\(/,
    /\.html\s*\(/,
    /\.loadFile\s*\(/,
    /\.addFont\s*\(/,
    /AcroForm/,
    /pdfobjectnewwindow/,
    /pdfjsnewwindow/,
    /dataurlnewwindow/,
  ]
  const findings = []
  for (const source of sources) {
    const content = fs.readFileSync(path.join(ROOT, source), 'utf8')
    for (const pattern of forbiddenApis) {
      if (pattern.test(content)) findings.push(`${source}: ${pattern}`)
    }
  }
  record(
    'API jsPDF',
    findings.length === 0,
    findings.length === 0
      ? 'Nessuna API vulnerabile addJS/html/loadFile/addFont/AcroForm/new-window rilevata'
      : findings.join('; '),
  )
}

try {
  createFmeaPdf()
  createRcaPdf()
  createGapPdf()
  validateSourceUsage()
} catch (error) {
  record('Esecuzione', false, error instanceof Error ? error.stack || error.message : String(error))
}

const summary = {
  PASS: results.filter((result) => result.status === STATUS.PASS).length,
  FAIL: results.filter((result) => result.status === STATUS.FAIL).length,
}

writeResult('pdf-regression.json', { generatedAt: new Date().toISOString(), summary, results })

console.log(`PDF REGRESSION: ${summary.PASS} PASS, ${summary.FAIL} FAIL`)
if (summary.FAIL > 0) process.exitCode = 1
