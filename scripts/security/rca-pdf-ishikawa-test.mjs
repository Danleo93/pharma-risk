import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { jsPDF } from 'jspdf/dist/jspdf.es.min.js'

const result = await build({
  entryPoints: ['src/lib/rcaPdfIshikawa.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  logLevel: 'silent',
})
const { renderIshikawaPdfPages } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`
)

const branches = Array.from({ length: 7 }, (_, index) => ({
  id: String(index),
  name: `Categoria sintetica ${index + 1}`,
  source_type: 'custom',
  causes: Array.from({ length: index === 0 ? 4 : 3 }, (_, causeIndex) => ({
    id: `${index}-${causeIndex}`,
    description: `Causa sintetica ${index}-${causeIndex}: ${'dettaglio metodologico '.repeat(5)}`,
    is_root_cause: causeIndex === 0 && index < 3,
  })),
}))

const doc = new jsPDF()
renderIshikawaPdfPages(doc, {
  assessment: {
    title: 'Assessment RCA sintetico',
    event_title: 'Evento sintetico',
    event_description: 'Descrizione sintetica',
  },
  branches,
})

assert.equal(doc.getNumberOfPages(), 3, 'Seven categories need two landscape diagram pages')
for (const page of [2, 3]) {
  doc.setPage(page)
  assert.ok(doc.internal.pageSize.getWidth() > doc.internal.pageSize.getHeight(), 'Diagram must be landscape')
}
const pdf = Buffer.from(doc.output('arraybuffer'))
const raw = pdf.toString('latin1')
assert.ok(raw.startsWith('%PDF-'))
assert.ok(raw.includes('Diagramma Ishikawa'))
assert.ok(raw.includes('Categoria sintetica 7'), 'Last category must appear on second diagram page')
assert.ok(pdf.length > 10_000)
console.log(`PASS RCA Ishikawa PDF: 7 categories, 2 landscape pages, ${pdf.length} bytes`)
