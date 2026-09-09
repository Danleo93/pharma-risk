import { assertLocalEnvironment, printResult, STATUS } from './lib.mjs'

try {
  const config = await assertLocalEnvironment()
  console.log('ENVIRONMENT: LOCAL')
  printResult('Guardrail Supabase', STATUS.PASS, new URL(config.supabaseUrl).host)
} catch (error) {
  console.error('ENVIRONMENT: ABORT')
  printResult(
    'Guardrail Supabase',
    STATUS.FAIL,
    error instanceof Error ? error.message : String(error),
  )
  process.exitCode = 1
}
