import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { printResult, ROOT, STATUS, writeResult } from './lib.mjs'

const confirmedSecretRules = [
  { id: 'supabase-secret-key', regex: /\bsb_secret_[A-Za-z0-9_-]{20,}\b/g },
  { id: 'github-token', regex: /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,})\b/g },
  { id: 'database-connection-string', regex: /\bpostgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@[^\s]+/gi },
  { id: 'service-role-assignment', regex: /(?:SUPABASE_SERVICE_ROLE_KEY|service_role_key)\s*[=:]\s*["']?(?!<)[A-Za-z0-9._-]{20,}/gi },
  { id: 'jwt-secret-assignment', regex: /(?:SUPABASE_JWT_SECRET|JWT_SECRET)\s*[=:]\s*["']?(?!<)[A-Za-z0-9._-]{20,}/gi },
  { id: 'vercel-token-assignment', regex: /VERCEL_TOKEN\s*[=:]\s*["']?(?!<)[A-Za-z0-9._-]{20,}/gi },
]

const reviewRules = [
  { id: 'password-literal', regex: /(?:password|passwd)\s*[:=]\s*["'][^"'\r\n]{8,}["']/gi },
  { id: 'api-key-literal', regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][A-Za-z0-9._-]{20,}["']/gi },
]

const excludedPrefixes = [
  '.git/', 'node_modules/', 'dist/', '.security-results/', 'outputs/', 'tmp/',
]
const excludedExact = new Set([
  'documentazione tecnica PhaRMA T.docx',
  'codice per procedura di oblio.txt',
])

function normalize(filePath) {
  return filePath.replaceAll('\\', '/')
}

function isExcluded(relativePath) {
  const normalized = normalize(relativePath)
  return excludedExact.has(normalized) || excludedPrefixes.some((prefix) => normalized.startsWith(prefix))
}

function listCandidateFiles() {
  const run = spawnSync('git', ['ls-files', '-co', '--exclude-standard'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  return [...new Set((run.stdout || '').split(/\r?\n/).filter(Boolean))]
    .filter((file) => !isExcluded(file))
}

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length
}

function classifyReview(file, rule) {
  const normalized = normalize(file)
  if (
    rule === 'password-literal'
    && (
      normalized === 'supabase/seed.sql'
      || normalized === 'scripts/verify-local-supabase.mjs'
      || normalized.startsWith('scripts/security/')
    )
  ) return 'synthetic-local-fixture'
  if (normalized.endsWith('.example')) return 'placeholder'
  return 'manual-review'
}

const findings = []
for (const file of listCandidateFiles()) {
  const absolute = path.join(ROOT, file)
  let stat
  try {
    stat = fs.statSync(absolute)
  } catch {
    continue
  }
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) continue

  let content
  try {
    content = fs.readFileSync(absolute, 'utf8')
  } catch {
    continue
  }
  if (content.includes('\u0000')) continue

  for (const rule of confirmedSecretRules) {
    rule.regex.lastIndex = 0
    for (const match of content.matchAll(rule.regex)) {
      findings.push({
        scope: 'working-tree',
        file: normalize(file),
        line: lineNumber(content, match.index || 0),
        rule: rule.id,
        classification: 'potential-secret',
      })
    }
  }
  for (const rule of reviewRules) {
    rule.regex.lastIndex = 0
    for (const match of content.matchAll(rule.regex)) {
      findings.push({
        scope: 'working-tree',
        file: normalize(file),
        line: lineNumber(content, match.index || 0),
        rule: rule.id,
        classification: classifyReview(file, rule.id),
      })
    }
  }
}

const historyPattern = [
  'sb_secret_[A-Za-z0-9_-]{20,}',
  'github_pat_[A-Za-z0-9_]{20,}',
  'gh[pousr]_[A-Za-z0-9]{20,}',
  'postgres(ql)?://[^[:space:]]+:[^[:space:]@]+@',
  '(SUPABASE_SERVICE_ROLE_KEY|service_role_key)[[:space:]]*[=:][[:space:]]*[A-Za-z0-9._-]{20,}',
  '(SUPABASE_JWT_SECRET|JWT_SECRET)[[:space:]]*[=:][[:space:]]*[A-Za-z0-9._-]{20,}',
  'VERCEL_TOKEN[[:space:]]*[=:][[:space:]]*[A-Za-z0-9._-]{20,}',
].join('|')

const commits = spawnSync('git', ['rev-list', '--all'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
}).stdout.split(/\r?\n/).filter(Boolean)

const historyLocations = new Map()
for (const commit of commits) {
  const run = spawnSync('git', ['grep', '-I', '-l', '-E', historyPattern, commit, '--'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 5 * 1024 * 1024,
  })
  for (const raw of (run.stdout || '').split(/\r?\n/).filter(Boolean)) {
    const separator = raw.indexOf(':')
    const file = normalize(separator >= 0 ? raw.slice(separator + 1) : raw)
    if (isExcluded(file)) continue
    const key = `${commit.slice(0, 12)}:${file}`
    historyLocations.set(key, {
      scope: 'git-history',
      commit: commit.slice(0, 12),
      file,
      rule: 'high-confidence-secret-pattern',
      classification: 'potential-secret',
    })
  }
}

findings.push(...historyLocations.values())

const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8')
const ignoreChecks = {
  genericEnvIgnored: /^\.env\.\*$/m.test(gitignore),
  baseEnvIgnored: /^\.env$/m.test(gitignore),
  localDevelopmentExplicitlyAllowed: /^!\.env\.development$/m.test(gitignore),
  exampleExplicitlyAllowed: /^!\.env\.example$/m.test(gitignore),
}

const potentialSecrets = findings.filter((finding) => finding.classification === 'potential-secret')
const manualReview = findings.filter((finding) => finding.classification === 'manual-review')
const expectedFixtures = findings.filter((finding) => (
  finding.classification === 'synthetic-local-fixture' || finding.classification === 'placeholder'
))

let status = STATUS.PASS
if (potentialSecrets.length > 0) status = STATUS.FAIL
else if (manualReview.length > 0 || expectedFixtures.length > 0 || ignoreChecks.localDevelopmentExplicitlyAllowed) status = STATUS.WARNING

printResult(
  'Secret scan working tree + history',
  status,
  `${potentialSecrets.length} potenziali segreti; ${manualReview.length} da revisionare; ${expectedFixtures.length} fixture/placeholder.`,
)

writeResult('secret-scan.json', {
  generatedAt: new Date().toISOString(),
  status,
  note: 'Il report non contiene valori rilevati, soltanto posizione, regola e classificazione.',
  scanner: 'Pattern scanner locale equivalente; gitleaks non richiesto come dipendenza.',
  ignoreChecks,
  findings,
})

if (status === STATUS.FAIL) process.exitCode = 1
