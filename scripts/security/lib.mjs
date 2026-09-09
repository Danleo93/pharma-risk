import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

export const ROOT = process.cwd()
export const RESULTS_DIR = path.join(ROOT, '.security-results')
export const ENV_PATH = path.join(ROOT, '.env.development')

export const USERS = [
  {
    label: 'USER_A',
    id: '10000000-0000-4000-8000-000000000001',
    email: 'user_a@pharmat.local',
    password: 'LocalOnly!Passw0rd-A',
    suffix: '1',
  },
  {
    label: 'USER_B',
    id: '10000000-0000-4000-8000-000000000002',
    email: 'user_b@pharmat.local',
    password: 'LocalOnly!Passw0rd-B',
    suffix: '2',
  },
]

export const STATUS = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  WARNING: 'WARNING',
}

export function readEnvFile(filePath = ENV_PATH) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Configurazione locale assente: ${path.relative(ROOT, filePath)}.`)
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=')
        return [line.slice(0, separator), line.slice(separator + 1)]
      }),
  )
}

function assertLocalUrl(rawUrl, label) {
  if (!rawUrl) return

  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error(`${label} non contiene un URL valido.`)
  }

  if (parsed.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(parsed.hostname)) {
    throw new Error(`${label} non punta a Supabase locale.`)
  }
}

export async function assertLocalEnvironment() {
  const env = readEnvFile()
  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.startsWith('<')) {
    throw new Error('Configurazione Supabase locale incompleta in .env.development.')
  }

  assertLocalUrl(supabaseUrl, 'VITE_SUPABASE_URL')

  for (const key of ['VITE_SUPABASE_URL', 'SUPABASE_URL', 'SUPABASE_DB_URL']) {
    if (process.env[key]) assertLocalUrl(process.env[key], key)
  }

  const linkedRefPaths = [
    path.join(ROOT, 'supabase', '.temp', 'project-ref'),
    path.join(ROOT, '.supabase', 'project-ref'),
  ]

  for (const linkedRefPath of linkedRefPaths) {
    if (fs.existsSync(linkedRefPath) && fs.readFileSync(linkedRefPath, 'utf8').trim()) {
      throw new Error('Repository collegato a un project ref remoto: test annullati.')
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
      headers: { apikey: supabaseAnonKey },
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`Data API locale non disponibile (HTTP ${response.status}).`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Supabase locale non raggiungibile: ${message}`)
  } finally {
    clearTimeout(timeout)
  }

  return { supabaseUrl, supabaseAnonKey }
}

export function createLocalClient(config) {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export async function signInSyntheticUser(config, user) {
  const client = createLocalClient(config)
  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })
  if (error || !data.session || data.user?.id !== user.id) {
    throw new Error(`${user.label}: autenticazione locale fallita.`)
  }
  return client
}

export function ensureResultsDir() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true })
}

export function writeResult(name, data) {
  ensureResultsDir()
  const filePath = path.join(RESULTS_DIR, name)
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  return filePath
}

export function printResult(label, status, detail = '') {
  const suffix = detail ? ` - ${detail}` : ''
  console.log(`${status.padEnd(7)} ${label}${suffix}`)
}

export function makeUuid(namespace, sequence = 1) {
  const ns = String(namespace).padStart(4, '0').slice(-4)
  const seq = String(sequence).padStart(12, '0').slice(-12)
  return `9${ns.slice(1)}0000-0000-4000-8000-${seq}`
}

export function seededId(prefix, user) {
  const firstGroup = `${prefix}${'0'.repeat(Math.max(0, 8 - String(prefix).length))}`
  return `${firstGroup}-0000-4000-8000-00000000000${user.suffix}`
}

export function isRlsDenied(error) {
  return Boolean(error && ['42501', 'PGRST116'].includes(error.code))
}

export function summarizeStatuses(items) {
  const counts = { PASS: 0, FAIL: 0, WARNING: 0 }
  for (const item of items) {
    if (counts[item.status] !== undefined) counts[item.status] += 1
  }
  return counts
}
