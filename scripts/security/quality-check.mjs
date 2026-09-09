import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { printResult, ROOT, STATUS, writeResult } from './lib.mjs'

const eslintCommand = process.platform === 'win32'
  ? path.join(ROOT, 'node_modules', '.bin', 'eslint.cmd')
  : path.join(ROOT, 'node_modules', '.bin', 'eslint')

const knownBaseline = {
  errorCount: 46,
  warningCount: 1,
  rules: {
    'react-hooks/set-state-in-effect': 1,
    'react-hooks/immutability': 8,
    '@typescript-eslint/no-explicit-any': 12,
    'no-irregular-whitespace': 21,
    'react-refresh/only-export-components': 1,
    'react-hooks/preserve-manual-memoization': 3,
    'react-hooks/exhaustive-deps': 1,
  },
}

const build = process.platform === 'win32'
  ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm.cmd run build'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  })
  : spawnSync('npm', ['run', 'build'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  })
const buildStatus = build.status === 0 ? STATUS.PASS : STATUS.FAIL
printResult('Build production', buildStatus, build.status === 0 ? 'Completata' : 'Fallita')

const lint = process.platform === 'win32'
  ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'node_modules\\.bin\\eslint.cmd . --format json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  })
  : spawnSync(eslintCommand, ['.', '--format', 'json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  })

let lintResults = []
let lintParseError = ''
try {
  if (!lint.stdout?.trim()) throw new Error(lint.stderr || 'ESLint non ha prodotto output JSON.')
  lintResults = JSON.parse(lint.stdout)
} catch (error) {
  lintParseError = error instanceof Error ? error.message : String(error)
}

const actual = lintResults.reduce((summary, file) => {
  summary.errorCount += file.errorCount || 0
  summary.warningCount += file.warningCount || 0
  for (const message of file.messages || []) {
    const key = message.ruleId || 'parser/configuration'
    summary.rules[key] = (summary.rules[key] || 0) + 1
  }
  return summary
}, { errorCount: 0, warningCount: 0, rules: {} })

const regression = lintParseError
  || actual.errorCount > knownBaseline.errorCount
  || actual.warningCount > knownBaseline.warningCount
  || Object.entries(actual.rules).some(([rule, count]) => count > (knownBaseline.rules[rule] || 0))
const lintStatus = regression ? STATUS.FAIL : (actual.errorCount || actual.warningCount ? STATUS.WARNING : STATUS.PASS)
printResult(
  'ESLint baseline',
  lintStatus,
  lintParseError || `${actual.errorCount} errori e ${actual.warningCount} warning noti; nessuna correzione in Milestone 2A.`,
)

writeResult('quality.json', {
  generatedAt: new Date().toISOString(),
  build: {
    status: buildStatus,
    exitCode: build.status,
    outputTail: `${build.stdout}\n${build.stderr}`.trim().split(/\r?\n/).slice(-20),
  },
  lint: {
    status: lintStatus,
    exitCode: lint.status,
    knownBaseline,
    actual,
    parseError: lintParseError || null,
  },
})

if (buildStatus === STATUS.FAIL || lintStatus === STATUS.FAIL) process.exitCode = 1
