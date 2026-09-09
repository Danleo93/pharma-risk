import fs from 'node:fs'
import path from 'node:path'
import { matchRoutes } from 'react-router-dom'
import { printResult, ROOT, STATUS, writeResult } from './lib.mjs'

const appPath = path.join(ROOT, 'src', 'App.tsx')
const layoutPath = path.join(ROOT, 'src', 'components', 'Layout.tsx')
const appSource = fs.readFileSync(appPath, 'utf8')
const layoutSource = fs.readFileSync(layoutPath, 'utf8')
const results = []

function record(name, condition, detail = '') {
  const status = condition ? STATUS.PASS : STATUS.FAIL
  results.push({ name, status, detail })
  printResult(name, status, detail)
}

const declaredPaths = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)]
  .map((match) => match[1])
const routeManifest = declaredPaths.map((routePath) => ({ path: routePath }))

record(
  'Router mode: SPA Declarative con BrowserRouter',
  /<BrowserRouter>/.test(appSource)
    && !/createBrowserRouter|RouterProvider|StaticRouter|ScrollRestoration|unstable_.*RSC|react-router\/server/.test(appSource),
  'Nessun Data Router, Framework Mode, SSR o RSC rilevato.',
)

const routeCases = [
  ['/login', '/login'],
  ['/privacy', '/privacy'],
  ['/start', '/start'],
  ['/fmea', '/fmea'],
  ['/fmea/dashboard', '/fmea/dashboard'],
  ['/fmea/assessment/11111111-1111-4111-8111-111111111111', '/fmea/assessment/:id'],
  ['/rca', '/rca'],
  ['/rca/dashboard', '/rca/dashboard'],
  ['/rca/assessment/22222222-2222-4222-8222-222222222222', '/rca/assessment/:id'],
  ['/gap', '/gap'],
  ['/gap/dashboard', '/gap/dashboard'],
  ['/gap/process/33333333-3333-4333-8333-333333333333', '/gap/process/:id'],
  ['/gap/assessment/44444444-4444-4444-8444-444444444444', '/gap/assessment/:id'],
  ['/assessment/55555555-5555-4555-8555-555555555555', '/assessment/:id'],
  ['/route-inesistente', '*'],
]

for (const [url, expectedPattern] of routeCases) {
  const matches = matchRoutes(routeManifest, url)
  const actualPattern = matches?.at(-1)?.route.path
  record(
    `Route ${url}`,
    actualPattern === expectedPattern,
    `Attesa ${expectedPattern}; ottenuta ${actualPattern || 'nessuna'}.`,
  )
}

record(
  'Route protette: redirect al login',
  /if\s*\(!user\)[\s\S]*?<Navigate\s+to="\/login"\s+replace\s*\/>/.test(appSource),
)
record(
  'Route pubbliche: redirect utente autenticato',
  /if\s*\(user\)[\s\S]*?<Navigate\s+to="\/start"\s+replace\s*\/>/.test(appSource),
)
record(
  'Redirect post-login centralizzato sui moduli disponibili',
  /getDefaultAvailableRoute/.test(appSource) && /<Route\s+path="\/start"/.test(appSource),
)
record(
  'Route FMEA protette da ModuleRoute',
  /path="\/fmea"[\s\S]*?moduleKey="FMEA"/.test(appSource)
    && /path="\/fmea\/dashboard"[\s\S]*?moduleKey="FMEA"/.test(appSource),
)
record(
  'Route RCA protette da ModuleRoute',
  /path="\/rca"[\s\S]*?moduleKey="RCA"/.test(appSource)
    && /path="\/rca\/dashboard"[\s\S]*?moduleKey="RCA"/.test(appSource),
)
record(
  'Route Gap protette da ModuleRoute',
  /path="\/gap"[\s\S]*?moduleKey="GAP_ANALYSIS"/.test(appSource)
    && /path="\/gap\/dashboard"[\s\S]*?moduleKey="GAP_ANALYSIS"/.test(appSource),
)
record(
  'Redirect legacy assessment con ID',
  /to=\{`\/fmea\/assessment\/\$\{id\}`\}/.test(appSource),
)
record(
  'Logout: chiusura sessione e ritorno al login',
  /await\s+signOut\(\)[\s\S]*?navigate\(['"]\/login['"]\)/.test(layoutSource),
)

const summary = {
  PASS: results.filter((item) => item.status === STATUS.PASS).length,
  FAIL: results.filter((item) => item.status === STATUS.FAIL).length,
}

writeResult('routing-regression.json', {
  generatedAt: new Date().toISOString(),
  mode: 'Declarative SPA',
  declaredPaths,
  summary,
  results,
})

if (summary.FAIL > 0) process.exitCode = 1
