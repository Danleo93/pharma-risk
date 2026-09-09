import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
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
const record = (name, condition, detail = '') => {
  const status = condition ? STATUS.PASS : STATUS.FAIL
  results.push({ name, status, detail })
  printResult(name, status, detail)
}

const bundleDir = path.join(ROOT, 'tmp', 'privacy-tests')
fs.mkdirSync(bundleDir, { recursive: true })
await build({
  entryPoints: [path.join(ROOT, 'src', 'lib', 'privacyDetector.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: path.join(bundleDir, 'privacyDetector.mjs'),
})
await build({
  entryPoints: [path.join(ROOT, 'src', 'lib', 'privacyRuntime.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: path.join(bundleDir, 'privacyRuntime.mjs'),
})

const detector = await import(`${pathToFileURL(path.join(bundleDir, 'privacyDetector.mjs')).href}?v=${Date.now()}`)
const runtime = await import(`${pathToFileURL(path.join(bundleDir, 'privacyRuntime.mjs')).href}?v=${Date.now()}`)

const kinds = (value) => detector.detectPrivacyPatterns(value).map((item) => item.kind)
record('Detector email: pattern sintetico rilevato', kinds('Contatto: audit.user@example.org').includes('email'))
record('Detector email: testo simile non classificato', !kinds('audit user at example dot org').includes('email'))
record('Detector CF: codice formalmente plausibile rilevato', detector.isPlausibleItalianFiscalCode('RSSMRA85T10A562S'))
record('Detector CF: controllo errato non classificato', !detector.isPlausibleItalianFiscalCode('RSSMRA85T10A562A'))
record('Detector telefono: mobile italiano rilevato', kinds('+39 347 123 4567').includes('phone'))
record('Detector telefono: fisso italiano rilevato', kinds('091 123 4567').includes('phone'))
record('Detector telefono: data, ora e numero tecnico esclusi', !kinds('2026-08-25 14:30 codice 500123456').includes('phone'))
record('Detector Unicode/copia-incolla: normalizzazione NFKC', kinds('audit.user＠example.org').includes('email'))

const findings = detector.scanPrivacyPayload('rca_assessments', {
  event_description: 'Contatto audit.user@example.org',
  event_date: '2026-08-25',
  event_time: '14:30',
})
record(
  'Privacy scan: campi temporali non bloccati e nessun match grezzo esposto',
  findings.length === 1
    && findings[0].kind === 'email'
    && !Object.hasOwn(findings[0], 'match')
    && !Object.hasOwn(findings[0], 'value'),
)

record(
  'Filename neutri: convenzione unica senza titolo libero',
  runtime.createNeutralExportFileName('RCA', new Date('2026-08-25T12:00:00Z'), 'pdf') === 'PhaRMA_T_RCA_2026-08-25.pdf'
    && runtime.createNeutralExportFileName('GAP', new Date('2026-08-25T12:00:00Z'), 'png', 'gantt') === 'PhaRMA_T_GAP_GANTT_2026-08-25.png',
)

const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
const appSource = read('src/App.tsx')
const supabaseSource = read('src/lib/supabase.ts')
const exportSources = [
  read('src/services/exportService.ts'),
  read('src/services/rcaExportService.ts'),
  read('src/services/gapExportService.ts'),
  read('src/services/gdprExport.ts'),
  read('src/lib/exportImage.ts'),
]
record(
  'Pre-save: provider globale e scan locale collegati alle scritture Supabase',
  appSource.includes('PrivacyGuardProvider')
    && supabaseSource.includes('scanPrivacyPayload')
    && supabaseSource.includes('requestPrivacyReview'),
)
record(
  'Export: warning privacy centralizzato su PDF/Excel/PNG/JSON',
  exportSources.every((source) => source.includes('confirmExportPrivacy')),
)
record(
  'Export: metadati PDF/Excel neutri',
  exportSources.slice(0, 3).every((source) => source.includes("author: 'PhaRMA T'") || source.includes("Author: 'PhaRMA T'")),
)

const sourceFiles = []
const collectFiles = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) collectFiles(fullPath)
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) sourceFiles.push(fullPath)
  }
}
collectFiles(path.join(ROOT, 'src'))
const sourceText = sourceFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
record(
  'Browser storage: nessun assessment in localStorage/sessionStorage/IndexedDB',
  !/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/.test(sourceText),
)
record(
  'Network egress: nessun SDK tracker o telemetria inatteso',
  !/sentry|hotjar|google-analytics|googletagmanager|mixpanel|segment\.com|sendBeacon\s*\(/i.test(sourceText)
    && !/sentry|hotjar|analytics|mixpanel|segment/i.test(JSON.stringify(JSON.parse(read('package.json')).dependencies)),
)
record(
  'Logging applicativo: nessun console.log e nessun riferimento email nei log',
  !/console\.log\s*\(/.test(sourceText)
    && !/console\.(?:warn|error)\s*\([^\n]*(?:user\.email|payload|event_description|gap_description)/.test(sourceText),
)

const configSource = read('supabase/config.toml')
const projectId = configSource.match(/^project_id\s*=\s*"([^"]+)"/m)?.[1]
if (!projectId) throw new Error('project_id locale non rilevato.')
const databaseContainer = `supabase_db_${projectId}`
const adminSql = (sql) => {
  const run = spawnSync('docker', [
    'exec', databaseContainer,
    'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atc', sql,
  ], { cwd: ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  if (run.status !== 0) throw new Error(run.stderr || run.stdout)
  return run.stdout.trim()
}

const clientA = await signInSyntheticUser(config, USERS[0])
const clientB = await signInSyntheticUser(config, USERS[1])
const assessmentTables = ['risk_assessments', 'rca_assessments', 'gap_assessments']

try {
  adminSql("update public.app_modules set status = 'read_only', allow_export_in_read_only = true, updated_by = null;")
  const readOnlyChecks = await Promise.all(assessmentTables.map(async (table) => {
    const [ownA, ownB] = await Promise.all([
      clientA.from(table).select('id,user_id'),
      clientB.from(table).select('id,user_id'),
    ])
    return !ownA.error && !ownB.error
      && ownA.data.every((row) => row.user_id === USERS[0].id)
      && ownB.data.every((row) => row.user_id === USERS[1].id)
      && ownA.data.length > 0
      && ownB.data.length > 0
  }))
  record('GDPR/read_only: USER_A e USER_B leggono solo i propri dataset', readOnlyChecks.every(Boolean))

  adminSql("update public.app_modules set status = 'disabled', allow_export_in_read_only = true, updated_by = null;")
  const disabledChecks = await Promise.all(assessmentTables.map(async (table) => {
    const { data, error } = await clientA.from(table).select('id,user_id')
    return !error && data.length > 0 && data.every((row) => row.user_id === USERS[0].id)
  }))
  const gdprSource = read('src/services/gdprExport.ts')
  record(
    'GDPR/disabled: dati propri ancora tecnicamente esportabili e servizio indipendente dai flag',
    disabledChecks.every(Boolean)
      && !gdprSource.includes('ensureRuntimeModuleCanExport')
      && !gdprSource.includes('app_modules'),
  )
} finally {
  adminSql("update public.app_modules set status = 'enabled', allow_export_in_read_only = true, updated_by = null;")
  await Promise.all([clientA.auth.signOut(), clientB.auth.signOut()])
}

const summary = {
  PASS: results.filter((item) => item.status === STATUS.PASS).length,
  FAIL: results.filter((item) => item.status === STATUS.FAIL).length,
}
writeResult('privacy.json', {
  generatedAt: new Date().toISOString(),
  environment: 'LOCAL',
  summary,
  results,
})

console.log(`PRIVACY: ${summary.PASS} PASS, ${summary.FAIL} FAIL`)
if (summary.FAIL > 0) process.exitCode = 1
