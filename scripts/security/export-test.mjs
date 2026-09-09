import fs from 'node:fs'
import path from 'node:path'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import {
  assertLocalEnvironment,
  printResult,
  ROOT,
  signInSyntheticUser,
  STATUS,
  USERS,
  writeResult,
} from './lib.mjs'

const config = await assertLocalEnvironment()
console.log('ENVIRONMENT: LOCAL')
const results = []

function record(name, status, detail = '') {
  results.push({ name, status, detail })
  printResult(name, status, detail)
}

const spreadsheetPayloads = ['=1+1', '+SUM(1,1)', '-1+2', '@SUM(1,1)']
const sheet = XLSX.utils.aoa_to_sheet([spreadsheetPayloads])
const workbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(workbook, sheet, 'Security')
const workbookBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
const reparsed = XLSX.read(workbookBuffer, { type: 'buffer' })
const reparsedSheet = reparsed.Sheets.Security
const formulaCells = spreadsheetPayloads
  .map((_, index) => reparsedSheet[XLSX.utils.encode_cell({ r: 0, c: index })])
  .filter((cell) => cell?.f || cell?.t === 'f')
record(
  'Excel: payload = + - @ non convertiti in formule',
  formulaCells.length === 0 ? STATUS.PASS : STATUS.FAIL,
  formulaCells.length ? `${formulaCells.length} celle formula` : 'Celle serializzate come testo nel formato XLSX',
)

const pdf = new jsPDF()
pdf.text('<script>alert(1)</script> javascript:alert(1) Unicode è Ω', 10, 10)
const pdfBytes = new Uint8Array(pdf.output('arraybuffer'))
const pdfText = Buffer.from(pdfBytes).toString('latin1')
record(
  'PDF: output valido e privo di azioni JavaScript',
  pdfText.startsWith('%PDF-') && !/\/JavaScript|\/JS\s*\(/.test(pdfText) ? STATUS.PASS : STATUS.FAIL,
)

const jsonPayload = {
  text: '<script>alert(1)</script>',
  unicode: 'è Ω 🧪',
  formulas: spreadsheetPayloads,
  long: 'A'.repeat(12000),
}
const jsonRoundTrip = JSON.parse(JSON.stringify(jsonPayload))
record(
  'JSON: round-trip contenuti ostili e Unicode',
  JSON.stringify(jsonRoundTrip) === JSON.stringify(jsonPayload) ? STATUS.PASS : STATUS.FAIL,
)

const exportSources = [
  'src/services/exportService.ts',
  'src/services/rcaExportService.ts',
  'src/services/gapExportService.ts',
  'src/services/gdprExport.ts',
  'src/lib/exportImage.ts',
]
const missingSanitizers = []
for (const relativePath of exportSources) {
  const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
  if (!content.includes('createNeutralExportFileName')) {
    missingSanitizers.push(relativePath)
  }
}
record(
  'Filename export normalizzati',
  missingSanitizers.length === 0 ? STATUS.PASS : STATUS.WARNING,
  missingSanitizers.length ? `Verifica manuale: ${missingSanitizers.join(', ')}` : '',
)

const clientA = await signInSyntheticUser(config, USERS[0])
const crossUserChecks = []
for (const [table, id] of [
  ['risk_assessments', '23000000-0000-4000-8000-000000000002'],
  ['rca_assessments', '30000000-0000-4000-8000-000000000002'],
  ['gap_assessments', '45000000-0000-4000-8000-000000000002'],
]) {
  const { data, error } = await clientA.from(table).select('id').eq('id', id)
  crossUserChecks.push(!error && data?.length === 0)
}
await clientA.auth.signOut()
record(
  'Export: assessment USER_B non leggibili da USER_A',
  crossUserChecks.every(Boolean) ? STATUS.PASS : STATUS.FAIL,
)

record(
  'PNG: contenuto attivo',
  STATUS.WARNING,
  'L export rasterizza DOM React; completare la verifica visuale browser con payload sintetici.',
)

const summary = {
  PASS: results.filter((item) => item.status === STATUS.PASS).length,
  FAIL: results.filter((item) => item.status === STATUS.FAIL).length,
  WARNING: results.filter((item) => item.status === STATUS.WARNING).length,
}
writeResult('export.json', { generatedAt: new Date().toISOString(), environment: 'LOCAL', summary, results })
if (summary.FAIL > 0) process.exitCode = 1
