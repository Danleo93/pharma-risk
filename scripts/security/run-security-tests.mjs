import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { assertLocalEnvironment, ensureResultsDir, printResult, RESULTS_DIR, ROOT, STATUS } from './lib.mjs'

try {
  await assertLocalEnvironment()
} catch (error) {
  console.error('ENVIRONMENT: BLOCKED')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

console.log('ENVIRONMENT: LOCAL')
ensureResultsDir()

const suites = [
  ['Routing regression', 'routing-regression-test.mjs', 'routing-regression.json'],
  ['Module state', 'module-state-test.mjs', 'module-state.json'],
  ['Privacy regression', 'privacy-regression-test.mjs', 'privacy.json'],
  ['Auth', 'auth-test.mjs', 'auth.json'],
  ['RLS', 'rls-test.mjs', 'rls.json'],
  ['Smoke funzionale', 'functional-smoke-test.mjs', 'functional-smoke.json'],
  ['IDOR', 'idor-test.mjs', 'idor.json'],
  ['Input ostili', 'input-test.mjs', 'input.json'],
  ['Export', 'export-test.mjs', 'export.json'],
  ['Excel regression', 'excel-regression-test.mjs', 'excel-regression.json'],
  ['PDF regression', 'pdf-regression-test.mjs', 'pdf-regression.json'],
  ['Dipendenze', 'dependency-audit.mjs', 'dependency-audit.json'],
  ['Segreti', 'secret-scan.mjs', 'secret-scan.json'],
  ['Build e lint', 'quality-check.mjs', 'quality.json'],
]

const summary = []
function inferStatus(result) {
  if (result?.status) return result.status
  if (result?.summary) {
    if (result.summary.FAIL > 0) return STATUS.FAIL
    if (result.summary.WARNING > 0) return STATUS.WARNING
    return STATUS.PASS
  }
  const nestedStatuses = [result?.build?.status, result?.lint?.status].filter(Boolean)
  if (nestedStatuses.includes(STATUS.FAIL)) return STATUS.FAIL
  if (nestedStatuses.includes(STATUS.WARNING)) return STATUS.WARNING
  return STATUS.PASS
}

for (const [label, script, resultFile] of suites) {
  console.log(`\n=== ${label} ===`)
  const run = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'security', script)], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
  })
  if (run.stdout) process.stdout.write(run.stdout)
  if (run.stderr) process.stderr.write(run.stderr)

  let result = null
  const resultPath = path.join(RESULTS_DIR, resultFile)
  if (fs.existsSync(resultPath)) {
    try {
      result = JSON.parse(fs.readFileSync(resultPath, 'utf8'))
    } catch {
      result = null
    }
  }

  const resultStatus = inferStatus(result)
  const status = run.status === 0 ? resultStatus : STATUS.FAIL
  summary.push({ label, status, exitCode: run.status, resultFile })
}

console.log('\n=== SECURITY BASELINE SUMMARY ===')
for (const item of summary) printResult(item.label, item.status, item.resultFile)
const failed = summary.filter((item) => item.status === STATUS.FAIL)
console.log(`TOTAL: ${summary.length - failed.length} senza failure, ${failed.length} failure`)
if (failed.length > 0) process.exitCode = 1
