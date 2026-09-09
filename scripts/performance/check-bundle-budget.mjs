import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const DEFAULT_WARNING_KIB = 200
const DEFAULT_FAILURE_KIB = 250

function readThreshold(name, fallback) {
  const rawValue = process.env[name]
  if (rawValue === undefined || rawValue.trim() === '') return fallback

  const value = Number(rawValue)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} deve essere un numero positivo espresso in KiB.`)
  }

  return value
}

function formatBytes(bytes) {
  return `${bytes.toLocaleString('it-IT')} B (${(bytes / 1024).toFixed(2)} KiB)`
}

async function main() {
  const warningKiB = readThreshold('PERFORMANCE_WARNING_KIB', DEFAULT_WARNING_KIB)
  const failureKiB = readThreshold('PERFORMANCE_FAILURE_KIB', DEFAULT_FAILURE_KIB)

  if (warningKiB >= failureKiB) {
    throw new Error('La soglia WARNING deve essere inferiore alla soglia FAIL.')
  }

  const distDirectory = resolve(process.cwd(), 'dist')
  const indexHtml = await readFile(resolve(distDirectory, 'index.html'), 'utf8')
  const entryMatch = indexHtml.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+\.js)["']/i)

  if (!entryMatch) {
    throw new Error('Entry JavaScript non trovata in dist/index.html. Eseguire prima npm run build.')
  }

  const relativeEntryPath = entryMatch[1].replace(/^\//, '')
  const entryPath = resolve(distDirectory, relativeEntryPath)
  const entryBuffer = await readFile(entryPath)
  const gzipBytes = gzipSync(entryBuffer, { level: 9 }).byteLength
  const warningBytes = warningKiB * 1024
  const failureBytes = failureKiB * 1024

  let status = 'PASS'
  let exitCode = 0

  if (gzipBytes > failureBytes) {
    status = 'FAIL'
    exitCode = 1
  } else if (gzipBytes >= warningBytes) {
    status = 'WARNING'
  }

  console.log('PhaRMA T Performance Budget')
  console.log(`Initial JS entry: ${relativeEntryPath}`)
  console.log(`Initial JS gzip: ${formatBytes(gzipBytes)}`)
  console.log(`Budget warning: ${warningKiB.toFixed(2)} KiB`)
  console.log(`Budget failure: ${failureKiB.toFixed(2)} KiB`)
  console.log(`Status: ${status}`)

  process.exitCode = exitCode
}

main().catch((error) => {
  console.error('PhaRMA T Performance Budget')
  console.error(`Status: FAIL - ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
