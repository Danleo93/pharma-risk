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
const client = await signInSyntheticUser(config, USERS[0])
const results = []

const hostileParts = [
  '<script>window.__PHARMA_SECURITY_TEST__=1</script>',
  '<b>HTML sintetico</b>',
  '<img src=x onerror="alert(1)">',
  'javascript:alert(1)',
  `Virgolette "doppie" e apostrofo '`,
  'Unicode: è à Ω 漢字',
  'Emoji: 🧪 ✅',
  'Riga uno\nRiga due\r\nRiga tre',
  'Controllo:\u0001',
  `Lungo:${'A'.repeat(12000)}`,
]
const hostileText = hostileParts.join('\n---\n')

function record(name, status, detail = '') {
  results.push({ name, status, detail })
  printResult(name, status, detail)
}

const fixtures = [
  {
    module: 'FMEA',
    table: 'risk_assessments',
    id: makeUuid(951, 1),
    payload: {
      id: makeUuid(951, 1),
      user_id: USERS[0].id,
      title: 'Security input FMEA',
      description: hostileText,
      status: 'draft',
    },
    field: 'description',
  },
  {
    module: 'RCA',
    table: 'rca_assessments',
    id: makeUuid(952, 1),
    payload: {
      id: makeUuid(952, 1),
      user_id: USERS[0].id,
      title: 'Security input RCA',
      event_title: 'Evento sintetico ostile',
      event_description: hostileText,
      status: 'draft',
    },
    field: 'event_description',
  },
  {
    module: 'Gap',
    table: 'gap_assessments',
    id: makeUuid(953, 1),
    payload: {
      id: makeUuid(953, 1),
      user_id: USERS[0].id,
      title: 'Security input Gap',
      description: hostileText,
      status: 'draft',
    },
    field: 'description',
  },
]

try {
  for (const fixture of fixtures) {
    await client.from(fixture.table).delete().eq('id', fixture.id)
    const { error: insertError } = await client.from(fixture.table).insert(fixture.payload)
    if (insertError) {
      record(`${fixture.module}: persistenza payload`, STATUS.FAIL, insertError.code || insertError.message)
      continue
    }

    const { data, error } = await client
      .from(fixture.table)
      .select(`id,${fixture.field}`)
      .eq('id', fixture.id)
      .single()
    record(
      `${fixture.module}: persistenza e lettura payload`,
      !error && data?.[fixture.field] === hostileText ? STATUS.PASS : STATUS.FAIL,
    )
  }

  const sourceFiles = []
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name)
      if (entry.isDirectory()) walk(fullPath)
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) sourceFiles.push(fullPath)
    }
  }
  walk(path.join(ROOT, 'src'))
  const activeRenderingMatches = []
  for (const filePath of sourceFiles) {
    const content = fs.readFileSync(filePath, 'utf8')
    if (/dangerouslySetInnerHTML|\.innerHTML\s*=|document\.write\s*\(|\beval\s*\(|new Function\s*\(/.test(content)) {
      activeRenderingMatches.push(path.relative(ROOT, filePath).replaceAll('\\', '/'))
    }
  }
  record(
    'Rendering: assenza di API HTML attive nel sorgente',
    activeRenderingMatches.length === 0 ? STATUS.PASS : STATUS.FAIL,
    activeRenderingMatches.join(', '),
  )

  record(
    'XSS browser sui detail FMEA/RCA/Gap',
    STATUS.WARNING,
    'La persistenza e la renderizzazione React sono coperte; completare il controllo visuale browser descritto nel report.',
  )
} finally {
  for (const fixture of fixtures) await client.from(fixture.table).delete().eq('id', fixture.id)
  await client.auth.signOut()
}

const summary = {
  PASS: results.filter((item) => item.status === STATUS.PASS).length,
  FAIL: results.filter((item) => item.status === STATUS.FAIL).length,
  WARNING: results.filter((item) => item.status === STATUS.WARNING).length,
}
writeResult('input.json', { generatedAt: new Date().toISOString(), environment: 'LOCAL', summary, results })
if (summary.FAIL > 0) process.exitCode = 1
