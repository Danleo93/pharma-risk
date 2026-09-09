import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const envPath = path.join(root, '.env.development')

if (!fs.existsSync(envPath)) {
  throw new Error('File .env.development non trovato. Configura prima Supabase locale.')
}

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=')
      return [line.slice(0, separator), line.slice(separator + 1)]
    }),
)

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configurazione Supabase locale incompleta in .env.development.')
}

const parsedUrl = new URL(supabaseUrl)
if (!['127.0.0.1', 'localhost'].includes(parsedUrl.hostname)) {
  throw new Error(`Verifica annullata: l'URL Supabase non e locale (${parsedUrl.hostname}).`)
}

const users = [
  {
    label: 'USER_A',
    id: '10000000-0000-4000-8000-000000000001',
    otherId: '10000000-0000-4000-8000-000000000002',
    email: 'user_a@pharmat.local',
    password: 'LocalOnly!Passw0rd-A',
  },
  {
    label: 'USER_B',
    id: '10000000-0000-4000-8000-000000000002',
    otherId: '10000000-0000-4000-8000-000000000001',
    email: 'user_b@pharmat.local',
    password: 'LocalOnly!Passw0rd-B',
  },
]

const assessmentTables = ['risk_assessments', 'rca_assessments', 'gap_assessments']

function createLocalClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function assertUserIsolation(client, user) {
  for (const table of assessmentTables) {
    const { data, error } = await client.from(table).select('id,user_id')
    if (error) throw error

    assert(data.length === 1, `${user.label}: ${table} dovrebbe contenere un solo record visibile.`)
    assert(data[0].user_id === user.id, `${user.label}: RLS non ha isolato ${table}.`)

    const { data: foreignRows, error: foreignError } = await client
      .from(table)
      .select('id')
      .eq('user_id', user.otherId)

    if (foreignError) throw foreignError
    assert(foreignRows.length === 0, `${user.label}: visibili record appartenenti all'altro utente in ${table}.`)
  }
}

async function exerciseAssessmentCrud(client, userId, table) {
  const suffix = `${Date.now()}-${table}`
  const common = { user_id: userId, title: `Smoke test locale ${suffix}`, status: 'draft' }
  const payload =
    table === 'rca_assessments'
      ? { ...common, event_title: `Evento sintetico ${suffix}` }
      : common

  const { data: created, error: createError } = await client
    .from(table)
    .insert(payload)
    .select('id,title,status')
    .single()

  if (createError) throw createError

  try {
    const { data: updated, error: updateError } = await client
      .from(table)
      .update({ title: `${payload.title} aggiornato`, status: 'in_progress' })
      .eq('id', created.id)
      .eq('user_id', userId)
      .select('id,title,status')
      .single()

    if (updateError) throw updateError
    assert(updated.status === 'in_progress', `${table}: aggiornamento non persistito.`)
  } finally {
    const { error: deleteError } = await client
      .from(table)
      .delete()
      .eq('id', created.id)
      .eq('user_id', userId)

    if (deleteError) throw deleteError
  }

  const { data: deletedRows, error: readAfterDeleteError } = await client
    .from(table)
    .select('id')
    .eq('id', created.id)

  if (readAfterDeleteError) throw readAfterDeleteError
  assert(deletedRows.length === 0, `${table}: eliminazione non riuscita.`)
}

for (const user of users) {
  const client = createLocalClient()
  const { error: signInError } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })

  if (signInError) throw signInError

  await assertUserIsolation(client, user)

  if (user.label === 'USER_A') {
    for (const table of assessmentTables) {
      await exerciseAssessmentCrud(client, user.id, table)
    }
  }

  await client.auth.signOut()
  console.log(`${user.label}: autenticazione e isolamento RLS verificati.`)
}

console.log('FMEA/RCA/Gap: CRUD assessment locale verificato.')
