import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  assertLocalEnvironment,
  makeUuid,
  printResult,
  ROOT,
  signInSyntheticUser,
  STATUS,
  USERS,
  writeResult,
} from './lib.mjs'

const config = await assertLocalEnvironment()
console.log('ENVIRONMENT: LOCAL')

const configSource = fs.readFileSync(path.join(ROOT, 'supabase', 'config.toml'), 'utf8')
const projectId = configSource.match(/^project_id\s*=\s*"([^"]+)"/m)?.[1]
if (!projectId) throw new Error('project_id locale non rilevato in supabase/config.toml.')
const databaseContainer = `supabase_db_${projectId}`

function adminSql(sql) {
  const run = spawnSync('docker', [
    'exec', databaseContainer,
    'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atc', sql,
  ], { cwd: ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  if (run.status !== 0) {
    throw new Error(`SQL amministrativo locale fallito: ${run.stderr || run.stdout}`)
  }
  return run.stdout.trim()
}

function setModuleStatus(moduleKey, status, allowExportInReadOnly = true) {
  adminSql(`
    update public.app_modules
    set status = '${status}',
        allow_export_in_read_only = ${allowExportInReadOnly ? 'true' : 'false'},
        updated_by = null
    where module_key = '${moduleKey}';
  `)
}

const results = []
function record(name, condition, detail = '') {
  const status = condition ? STATUS.PASS : STATUS.FAIL
  results.push({ name, status, detail })
  printResult(name, status, detail)
}

const user = USERS[0]
const client = await signInSyntheticUser(config, user)

const modules = [
  {
    key: 'FMEA',
    table: 'areas',
    seededId: '20000000-0000-4000-8000-000000000001',
    payload: (id, suffix) => ({ id, user_id: user.id, name: `Module FMEA ${suffix}` }),
    patch: (suffix) => ({ description: `Updated ${suffix}` }),
  },
  {
    key: 'RCA',
    table: 'rca_assessments',
    seededId: '30000000-0000-4000-8000-000000000001',
    payload: (id, suffix) => ({
      id,
      user_id: user.id,
      title: `Module RCA ${suffix}`,
      event_title: `Synthetic event ${suffix}`,
      status: 'draft',
    }),
    patch: (suffix) => ({ description: `Updated ${suffix}` }),
  },
  {
    key: 'GAP_ANALYSIS',
    table: 'gap_processes',
    seededId: '40000000-0000-4000-8000-000000000001',
    payload: (id, suffix) => ({
      id,
      user_id: user.id,
      code: `MODULE-${suffix}`,
      name: `Module Gap ${suffix}`,
    }),
    patch: (suffix) => ({ description: `Updated ${suffix}` }),
  },
]

async function canSelect(table, id) {
  const { data, error } = await client.from(table).select('id').eq('id', id)
  return !error && data?.length === 1
}

async function insertAllowed(module, id, suffix) {
  const { error } = await client.from(module.table).insert(module.payload(id, suffix))
  return !error
}

async function updateAllowed(module, id, suffix) {
  const { data, error } = await client
    .from(module.table)
    .update(module.patch(suffix))
    .eq('id', id)
    .select('id')
  return !error && data?.length === 1
}

async function deleteAllowed(module, id) {
  const { data, error } = await client.from(module.table).delete().eq('id', id).select('id')
  return !error && data?.length === 1
}

async function insertDenied(module, id, suffix) {
  const { error } = await client.from(module.table).insert(module.payload(id, suffix))
  if (!error) await client.from(module.table).delete().eq('id', id)
  return Boolean(error)
}

async function updateDenied(module, id, suffix) {
  const { data, error } = await client
    .from(module.table)
    .update(module.patch(suffix))
    .eq('id', id)
    .select('id')
  return Boolean(error) || (data?.length || 0) === 0
}

async function deleteDenied(module, id) {
  const { data, error } = await client.from(module.table).delete().eq('id', id).select('id')
  return Boolean(error) || (data?.length || 0) === 0
}

try {
  adminSql(`
    update public.app_modules
    set status = 'enabled', allow_export_in_read_only = true, updated_by = null;
  `)

  const policyCount = Number(adminSql(`
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and policyname like 'Module % write gate %';
  `))
  record('RLS: 29 tabelle con tre write gate restrittivi', policyCount === 87, `${policyCount}/87 policy`)

  const { data: moduleRows, error: configError } = await client
    .from('app_modules')
    .select('module_key, status, allow_export_in_read_only')
  record('Configurazione: SELECT autenticato consentito', !configError && moduleRows?.length === 3)

  const { data: forbiddenUpdate, error: forbiddenUpdateError } = await client
    .from('app_modules')
    .update({ status: 'disabled' })
    .eq('module_key', 'RCA')
    .select('module_key')
  record(
    'Configurazione: scrittura client ordinario negata',
    Boolean(forbiddenUpdateError) || (forbiddenUpdate?.length || 0) === 0,
  )

  for (const [index, module] of modules.entries()) {
    const enabledId = makeUuid(981 + index, 1)
    const persistentId = makeUuid(985 + index, 1)
    const deniedReadOnlyId = makeUuid(989 + index, 1)
    const deniedDisabledId = makeUuid(993 + index, 1)

    setModuleStatus(module.key, 'enabled')
    const enabledInsert = await insertAllowed(module, enabledId, `EN-${index}`)
    const enabledSelect = enabledInsert && await canSelect(module.table, enabledId)
    const enabledUpdate = enabledInsert && await updateAllowed(module, enabledId, `EN-${index}`)
    const enabledDelete = enabledInsert && await deleteAllowed(module, enabledId)
    record(
      `${module.key}/enabled: SELECT INSERT UPDATE DELETE`,
      enabledInsert && enabledSelect && enabledUpdate && enabledDelete,
    )

    const persistentCreated = await insertAllowed(module, persistentId, `KEEP-${index}`)
    if (!persistentCreated) throw new Error(`${module.key}: fixture persistente non creata.`)

    setModuleStatus(module.key, 'read_only', true)
    const readOnlySelect = await canSelect(module.table, persistentId)
    const readOnlyInsert = await insertDenied(module, deniedReadOnlyId, `RO-${index}`)
    const readOnlyUpdate = await updateDenied(module, persistentId, `RO-${index}`)
    const readOnlyDelete = await deleteDenied(module, persistentId)
    const { data: readOnlyConfig } = await client
      .from('app_modules')
      .select('allow_export_in_read_only')
      .eq('module_key', module.key)
      .single()
    record(
      `${module.key}/read_only: SELECT si, scritture no, export configurato`,
      readOnlySelect && readOnlyInsert && readOnlyUpdate && readOnlyDelete
        && readOnlyConfig?.allow_export_in_read_only === true,
    )

    setModuleStatus(module.key, 'disabled')
    const disabledSelect = await canSelect(module.table, persistentId)
    const disabledInsert = await insertDenied(module, deniedDisabledId, `DIS-${index}`)
    const disabledUpdate = await updateDenied(module, persistentId, `DIS-${index}`)
    const disabledDelete = await deleteDenied(module, persistentId)
    record(
      `${module.key}/disabled: SELECT DB si, scritture no`,
      disabledSelect && disabledInsert && disabledUpdate && disabledDelete,
    )

    setModuleStatus(module.key, 'enabled')
    const restoredUpdate = await updateAllowed(module, persistentId, `RESTORE-${index}`)
    const restoredDelete = await deleteAllowed(module, persistentId)
    record(
      `${module.key}: riattivazione e dati preservati`,
      restoredUpdate && restoredDelete && await canSelect(module.table, module.seededId),
    )
  }

  const rcaSeededBefore = adminSql(`select count(*) from public.rca_assessments where id = '30000000-0000-4000-8000-000000000001';`)
  setModuleStatus('RCA', 'disabled')
  const rcaSeededDisabled = adminSql(`select count(*) from public.rca_assessments where id = '30000000-0000-4000-8000-000000000001';`)
  setModuleStatus('RCA', 'enabled')
  const rcaSeededAfter = adminSql(`select count(*) from public.rca_assessments where id = '30000000-0000-4000-8000-000000000001';`)
  record(
    'Scenario RCA enabled -> disabled -> enabled: storico preservato',
    rcaSeededBefore === '1' && rcaSeededDisabled === '1' && rcaSeededAfter === '1',
  )

  const auditCount = Number(adminSql('select count(*) from public.app_module_status_events;'))
  record('Audit cambio stato registrato', auditCount > 0, `${auditCount} eventi locali`)

  const appSource = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8')
  const layoutSource = fs.readFileSync(path.join(ROOT, 'src', 'components', 'Layout.tsx'), 'utf8')
  const homeSource = fs.readFileSync(path.join(ROOT, 'src', 'pages', 'Home.tsx'), 'utf8')
  const supabaseSource = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'supabase.ts'), 'utf8')
  const gdprSource = fs.readFileSync(path.join(ROOT, 'src', 'services', 'gdprExport.ts'), 'utf8')
  const moduleExportSources = [
    ['FMEA', fs.readFileSync(path.join(ROOT, 'src', 'services', 'exportService.ts'), 'utf8')],
    ['RCA', fs.readFileSync(path.join(ROOT, 'src', 'services', 'rcaExportService.ts'), 'utf8')],
    ['GAP_ANALYSIS', fs.readFileSync(path.join(ROOT, 'src', 'services', 'gapExportService.ts'), 'utf8')],
  ]
  record(
    'Route: tre moduli protetti da ModuleRoute',
    ['FMEA', 'RCA', 'GAP_ANALYSIS'].every((key) => appSource.includes(`moduleKey="${key}"`)),
  )
  record(
    'Home e sidebar: visibilita centralizzata',
    layoutSource.includes('MODULE_DEFINITIONS.filter') && homeSource.includes('MODULE_DEFINITIONS.filter'),
  )
  record(
    'Frontend: mutazioni bloccate centralmente e fail-safe unknown',
    supabaseSource.includes('MODULE_WRITE_BLOCKED') && supabaseSource.includes('isRuntimeModuleWritable'),
  )
  record(
    'Export di modulo: gate runtime applicato a FMEA, RCA e Gap Analysis',
    moduleExportSources.every(([moduleKey, source]) => (
      source.includes('ensureRuntimeModuleCanExport')
      && source.includes(`ensureRuntimeModuleCanExport('${moduleKey}')`)
    )),
  )
  record(
    'GDPR export indipendente dai moduli',
    !gdprSource.includes('moduleRuntime') && !gdprSource.includes('app_modules'),
  )
} finally {
  adminSql(`
    update public.app_modules
    set status = 'enabled', allow_export_in_read_only = true, updated_by = null;
  `)
  await client.auth.signOut()
}

const summary = {
  PASS: results.filter((result) => result.status === STATUS.PASS).length,
  FAIL: results.filter((result) => result.status === STATUS.FAIL).length,
}
writeResult('module-state.json', {
  generatedAt: new Date().toISOString(),
  environment: 'LOCAL',
  summary,
  results,
})

console.log(`MODULE STATE: ${summary.PASS} PASS, ${summary.FAIL} FAIL`)
if (summary.FAIL > 0) process.exitCode = 1
