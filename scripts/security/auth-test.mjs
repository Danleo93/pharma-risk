import fs from 'node:fs'
import path from 'node:path'
import {
  assertLocalEnvironment,
  createLocalClient,
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
  const result = { name, status, detail }
  results.push(result)
  printResult(name, status, detail)
}

for (const user of USERS) {
  const client = await signInSyntheticUser(config, user)
  const { data: sessionData } = await client.auth.getSession()
  record(
    `${user.label}: login corretto`,
    sessionData.session?.user.id === user.id ? STATUS.PASS : STATUS.FAIL,
  )
  await client.auth.signOut()
  const { data: afterLogout } = await client.auth.getSession()
  record(
    `${user.label}: logout e sessione rimossa`,
    afterLogout.session === null ? STATUS.PASS : STATUS.FAIL,
  )
}

const badClient = createLocalClient(config)
const { error: wrongPasswordError } = await badClient.auth.signInWithPassword({
  email: USERS[0].email,
  password: 'PasswordErrata!123',
})
record('Credenziali errate rifiutate', wrongPasswordError ? STATUS.PASS : STATUS.FAIL)

const resetClient = createLocalClient(config)
const { error: resetError } = await resetClient.auth.resetPasswordForEmail(USERS[0].email, {
  redirectTo: 'http://127.0.0.1:5173/reset-password',
})
record(
  'Richiesta reset password locale',
  resetError ? STATUS.FAIL : STATUS.PASS,
  resetError?.message || 'Messaggio intercettabile in Mailpit locale',
)

const appSource = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8')
const protectedRoutes = [
  '/fmea/assessment/:id',
  '/rca/assessment/:id',
  '/gap/assessment/:id',
]
const protectedInCode = protectedRoutes.every((route) => (
  appSource.includes(`path="${route}"`) && appSource.includes('<ProtectedRoute>')
))
record('Route detail dichiarate protette', protectedInCode ? STATUS.PASS : STATUS.FAIL)

record(
  'UI con servizio Auth indisponibile',
  STATUS.WARNING,
  'Da validare manualmente interrompendo Supabase locale: nessun test automatizzato modifica il servizio.',
)

const summary = {
  PASS: results.filter((item) => item.status === STATUS.PASS).length,
  FAIL: results.filter((item) => item.status === STATUS.FAIL).length,
  WARNING: results.filter((item) => item.status === STATUS.WARNING).length,
}
writeResult('auth.json', { generatedAt: new Date().toISOString(), environment: 'LOCAL', summary, results })
if (summary.FAIL > 0) process.exitCode = 1
