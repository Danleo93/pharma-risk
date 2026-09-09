import fs from 'node:fs'
import path from 'node:path'
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

const clientA = await signInSyntheticUser(config, USERS[0])
const foreignResources = [
  ['FMEA assessment', 'risk_assessments', '23000000-0000-4000-8000-000000000002'],
  ['FMEA risk', 'risk_items', '25000000-0000-4000-8000-000000000002'],
  ['RCA assessment', 'rca_assessments', '30000000-0000-4000-8000-000000000002'],
  ['RCA cause', 'rca_causes', '31000000-0000-4000-8000-000000000002'],
  ['Gap assessment', 'gap_assessments', '45000000-0000-4000-8000-000000000002'],
  ['Gap evaluation', 'gap_activity_evaluations', '47000000-0000-4000-8000-000000000002'],
]

for (const [label, table, id] of foreignResources) {
  const { data, error } = await clientA.from(table).select('id').eq('id', id)
  record(
    `IDOR API: ${label} USER_B non accessibile a USER_A`,
    !error && data?.length === 0 ? STATUS.PASS : STATUS.FAIL,
    error?.code || '',
  )
}
await clientA.auth.signOut()

const appSource = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8')
const detailRoutes = [
  '/fmea/assessment/:id',
  '/rca/assessment/:id',
  '/gap/assessment/:id',
]
for (const route of detailRoutes) {
  const routeIndex = appSource.indexOf(`path="${route}"`)
  const nearby = routeIndex >= 0 ? appSource.slice(routeIndex, routeIndex + 500) : ''
  record(
    `IDOR route: ${route} protetta`,
    routeIndex >= 0 && nearby.includes('<ProtectedRoute>') ? STATUS.PASS : STATUS.FAIL,
  )
}

record(
  'IDOR browser autenticato con ID esterno',
  STATUS.WARNING,
  'Verifica visuale manuale richiesta: la barriera dati e coperta dai test API/RLS locali.',
)

const summary = {
  PASS: results.filter((item) => item.status === STATUS.PASS).length,
  FAIL: results.filter((item) => item.status === STATUS.FAIL).length,
  WARNING: results.filter((item) => item.status === STATUS.WARNING).length,
}
writeResult('idor.json', { generatedAt: new Date().toISOString(), environment: 'LOCAL', summary, results })
if (summary.FAIL > 0) process.exitCode = 1
