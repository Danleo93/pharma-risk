import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(import.meta.dirname, '../..')
const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pharmat-rca-pdf-'))
const previousDirectory = process.cwd()

const entry = `
  import { exportRCAToPDF } from './src/services/rcaExportService.ts'
  import { replaceModuleRuntimeState } from './src/lib/moduleRuntime.ts'

  const previousWarn = console.warn
  console.warn = (message) => {
    if (String(message).includes('Diagramma Ishikawa')) globalThis.__fallbackWarned = true
  }
  replaceModuleRuntimeState([{ moduleKey: 'RCA', status: 'enabled', allowExportInReadOnly: false }])
  const branches = Array.from({ length: 6 }, (_, index) => ({
    id: String(index),
    name: 'Categoria ' + (index + 1),
    source_type: 'custom',
    causes: Array.from({ length: index === 0 ? 4 : 3 }, (_, causeIndex) => ({
      id: index + '-' + causeIndex,
      description: 'Causa sintetica ' + index + '-' + causeIndex,
      category: 'Categoria ' + (index + 1),
      source_type: 'custom',
      is_root_cause: causeIndex === 0 && index < 3,
      root_cause_status: null,
      root_cause_confirmed_at: null,
      root_cause_confirmation_notes: null,
    })),
  }))
  const causes = branches.flatMap((branch) => branch.causes)
  await exportRCAToPDF({
    assessment: {
      title: 'Assessment RCA sintetico',
      event_title: 'Evento sintetico',
      event_description: 'Descrizione sintetica',
      status: 'draft',
    },
    branches,
    causes,
    candidateCauses: causes.filter((cause) => cause.is_root_cause),
    fiveWhyChains: [],
    actions: [],
  })
  console.warn = previousWarn
  globalThis.__rcaExportCompleted = true
`

try {
  const result = await build({
    stdin: { contents: entry, resolveDir: root, sourcefile: 'rca-pdf-test.ts', loader: 'ts' },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: path.join(outputDir, 'test.mjs'),
    logLevel: 'silent',
    plugins: [{
      name: 'browser-jspdf',
      setup(buildContext) {
        buildContext.onResolve({ filter: /^jspdf$/ }, () => ({
          path: path.join(root, 'node_modules/jspdf/dist/jspdf.es.min.js'),
        }))
      },
    }],
  })
  assert.equal(result.errors.length, 0)
  process.chdir(outputDir)
  await import(pathToFileURL(path.join(outputDir, 'test.mjs')).href)

  assert.equal(globalThis.__fallbackWarned, true, 'RCA should use the fallback when image capture fails')
  assert.equal(globalThis.__rcaExportCompleted, true, 'RCA export should finish after the fallback')
  console.log('PASS RCA PDF fallback: export completed, 6 categories, 19 synthetic causes')
} finally {
  process.chdir(previousDirectory)
  assert.ok(path.resolve(outputDir).startsWith(`${path.resolve(os.tmpdir())}${path.sep}`))
  fs.rmSync(outputDir, { recursive: true, force: true })
}
