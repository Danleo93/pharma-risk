import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { printResult, ROOT, STATUS, writeResult } from './lib.mjs'

const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const sourceText = collectSourceText(path.join(ROOT, 'src'))

const usage = {
  jspdf: { area: 'runtime', use: 'Generazione PDF lato client', reachable: true },
  'jspdf-autotable': { area: 'runtime', use: 'Tabelle nei PDF lato client', reachable: true },
  xlsx: { area: 'runtime', use: 'Export Excel lato client; nessun parsing di file utente', reachable: true },
  'react-router-dom': { area: 'runtime', use: 'Routing SPA in Declarative Mode con BrowserRouter', reachable: true },
  'react-router': { area: 'runtime', use: 'Dipendenza transitiva del router SPA; Data/Framework/SSR/RSC non usati', reachable: true },
  dompurify: { area: 'runtime-transitive', use: 'Dipendenza opzionale di jsPDF; API HTML jsPDF non rilevata', reachable: false },
  ws: { area: 'runtime-transitive', use: 'Trasporto Realtime Supabase; nessun canale Realtime rilevato nel sorgente', reachable: false },
  vite: { area: 'development/build', use: 'Dev server e build, non eseguito nel browser production', reachable: false },
  rollup: { area: 'development/build', use: 'Bundler transitivo di Vite', reachable: false },
  postcss: { area: 'development/build', use: 'Elaborazione CSS in build', reachable: false },
  nanoid: { area: 'development/build', use: 'Dipendenza transitiva build', reachable: false },
  picomatch: { area: 'development/tooling', use: 'Glob matching transitivo', reachable: false },
  minimatch: { area: 'development/tooling', use: 'Glob matching transitivo', reachable: false },
  'brace-expansion': { area: 'development/tooling', use: 'Glob expansion transitivo', reachable: false },
  'js-yaml': { area: 'development/tooling', use: 'Parsing configurazioni transitivo', reachable: false },
  flatted: { area: 'development/tooling', use: 'Serializzazione transitiva ESLint', reachable: false },
  ajv: { area: 'development/tooling', use: 'Validazione schema transitiva ESLint', reachable: false },
  '@babel/core': { area: 'development/build', use: 'Compilazione React', reachable: false },
}

function collectSourceText(directory) {
  let text = ''
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) walk(fullPath)
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) text += `\n${fs.readFileSync(fullPath, 'utf8')}`
    }
  }
  walk(directory)
  return text
}

function runAudit(args) {
  const run = process.platform === 'win32'
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npm.cmd audit --json ${args.join(' ')}`], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 30 * 1024 * 1024,
    })
    : spawnSync('npm', ['audit', '--json', ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 30 * 1024 * 1024,
    })
  try {
    const parsed = JSON.parse(run.stdout || '{}')
    if (!parsed.metadata || !parsed.vulnerabilities) {
      throw new Error(run.stderr || 'npm audit non ha prodotto metadati completi.')
    }
    return parsed
  } catch {
    throw new Error(`npm audit non ha restituito JSON valido: ${run.stderr || run.stdout}`)
  }
}

function installedVersion(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', name, 'package.json'), 'utf8')).version
  } catch {
    return 'non rilevata'
  }
}

function normalizeFix(fix) {
  if (!fix) return 'Nessuna correzione automatica proposta'
  if (fix === true) return 'Correzione automatica disponibile'
  return `${fix.name}@${fix.version}${fix.isSemVerMajor ? ' (major/breaking da verificare)' : ''}`
}

function normalizeVia(via) {
  return (via || []).map((item) => (
    typeof item === 'string'
      ? { dependency: item }
      : { source: item.source, title: item.title, url: item.url, severity: item.severity, range: item.range }
  ))
}

const all = runAudit([])
const production = runAudit(['--omit=dev'])
const inventory = Object.entries(all.vulnerabilities || {}).map(([name, vulnerability]) => {
  const direct = Boolean(vulnerability.isDirect)
  const declaredRuntime = Object.hasOwn(packageJson.dependencies || {}, name)
  const declaredDev = Object.hasOwn(packageJson.devDependencies || {}, name)
  const detectedImport = sourceText.includes(`'${name}'`) || sourceText.includes(`"${name}"`)
  const context = usage[name] || {
    area: declaredRuntime ? 'runtime' : 'development/transitive',
    use: detectedImport ? 'Import rilevato nel sorgente' : 'Dipendenza transitiva; uso diretto non rilevato',
    reachable: detectedImport,
  }
  return {
    package: name,
    installedVersion: installedVersion(name),
    direct,
    declaredRuntime,
    declaredDev,
    severity: vulnerability.severity,
    affectedRange: vulnerability.range,
    advisories: normalizeVia(vulnerability.via),
    proposedFix: normalizeFix(vulnerability.fixAvailable),
    applicationUse: context.use,
    executionArea: context.area,
    reachableFromApplication: context.reachable,
    breakingRisk: typeof vulnerability.fixAvailable === 'object' && vulnerability.fixAvailable.isSemVerMajor
      ? 'Alto: upgrade major'
      : 'Da verificare con build e regression test',
    requiredTests: context.reachable
      ? 'Build, flusso applicativo interessato, payload ostili e verifica export/browser'
      : 'Build, lint e toolchain; nessun flusso runtime diretto rilevato',
  }
})

const metadata = {
  all: all.metadata?.vulnerabilities || {},
  production: production.metadata?.vulnerabilities || {},
}
const criticalReachable = inventory.filter((item) => item.reachableFromApplication && item.severity === 'critical')
const status = inventory.length === 0 ? STATUS.PASS : STATUS.WARNING
printResult(
  'Dipendenze npm',
  status,
  `${inventory.length} pacchetti segnalati; ${criticalReachable.length} critici raggiungibili. Nessun aggiornamento applicato.`,
)
writeResult('dependency-audit.json', {
  generatedAt: new Date().toISOString(),
  snapshotNote: 'Risultato dipendente dal registro npm alla data di esecuzione.',
  metadata,
  inventory,
  status,
})
