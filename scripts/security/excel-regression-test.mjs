import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import * as XLSX from 'xlsx'
import { printResult, ROOT, STATUS, writeResult } from './lib.mjs'

const results = []

function record(name, condition, detail = '') {
  const status = condition ? STATUS.PASS : STATUS.FAIL
  results.push({ name, status, detail })
  printResult(name, status, detail)
}

const helperPath = path.join(ROOT, 'src', 'lib', 'spreadsheetSecurity.ts')
const helperSource = fs.readFileSync(helperPath, 'utf8')
const transpiledHelper = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const helperModule = await import(`data:text/javascript;base64,${Buffer.from(transpiledHelper).toString('base64')}`)
const { sanitizeSpreadsheetRows } = helperModule

const hostileValues = ['=1+1', '+SUM(1,1)', '-1+2', '@SUM(1,1)', '  =HYPERLINK("https://example.invalid")']
const neutralizedValues = sanitizeSpreadsheetRows([hostileValues])[0]
record(
  'Formula injection: prefissi pericolosi neutralizzati',
  neutralizedValues.every((value, index) => value === `'${hostileValues[index]}`),
)

const unicodeValue = 'Farmacista è Ω - attività/requisito'
const longValue = `Testo lungo ${'A'.repeat(12000)}`
const moduleFixtures = [
  { module: 'FMEA', sheets: ['Info', 'Rischi', 'Azioni Correttive'] },
  { module: 'RCA', sheets: ['Info', 'Cause', 'Azioni'] },
  { module: 'Gap', sheets: ['Riepilogo', 'Valutazioni', 'Gap rilevati', 'Azioni', 'Norme'] },
]

for (const fixture of moduleFixtures) {
  const workbook = XLSX.utils.book_new()
  fixture.sheets.forEach((sheetName, sheetIndex) => {
    const rows = sanitizeSpreadsheetRows([
      ['Campo', 'Valore', 'Unicode', 'Testo lungo', ...hostileValues],
      [`USER_A ${fixture.module} ${sheetIndex + 1}`, 'Dato sintetico', unicodeValue, longValue, ...hostileValues],
    ])
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), sheetName)
  })

  const bytes = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const reopened = XLSX.read(bytes, { type: 'buffer' })
  const firstRows = XLSX.utils.sheet_to_json(reopened.Sheets[fixture.sheets[0]], { header: 1, raw: true })
  const flattened = firstRows.flat().map((value) => String(value ?? ''))
  const formulaCells = Object.values(reopened.Sheets[fixture.sheets[0]])
    .filter((cell) => typeof cell === 'object' && cell !== null && ('f' in cell || cell.t === 'f'))

  record(
    `${fixture.module}: workbook e fogli previsti`,
    JSON.stringify(reopened.SheetNames) === JSON.stringify(fixture.sheets),
    `${reopened.SheetNames.length} fogli riaperti dal parser di test.`,
  )
  record(
    `${fixture.module}: Unicode, stringa lunga e isolamento USER_A`,
    flattened.includes(unicodeValue)
      && flattened.includes(longValue)
      && !flattened.some((value) => value.includes('USER_B')),
  )
  record(
    `${fixture.module}: nessuna cella formula`,
    formulaCells.length === 0 && neutralizedValues.every((value) => flattened.includes(String(value))),
  )
}

const exportSources = [
  'src/services/exportService.ts',
  'src/services/rcaExportService.ts',
  'src/services/gapExportService.ts',
]
const sourceReviews = exportSources.map((relativePath) => {
  const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
  return {
    relativePath,
    importsSanitizer: source.includes('spreadsheetSecurity'),
    readsWorkbook: /XLSX\.(read|readFile)\s*\(/.test(source),
    writesWorkbook: /XLSX\.(write|writeFile)\s*\(/.test(source),
  }
})

record(
  'Servizi applicativi: uso SheetJS esclusivamente WRITE',
  sourceReviews.every((review) => review.importsSanitizer && review.writesWorkbook && !review.readsWorkbook),
  sourceReviews.map((review) => `${review.relativePath}: READ=${review.readsWorkbook}, WRITE=${review.writesWorkbook}`).join('; '),
)

const summary = {
  PASS: results.filter((item) => item.status === STATUS.PASS).length,
  FAIL: results.filter((item) => item.status === STATUS.FAIL).length,
}

writeResult('excel-regression.json', {
  generatedAt: new Date().toISOString(),
  packageVersion: XLSX.version,
  applicationMode: 'WRITE-only; XLSX.read usato esclusivamente nel test con workbook sintetici generati localmente.',
  sourceReviews,
  summary,
  results,
})

if (summary.FAIL > 0) process.exitCode = 1
