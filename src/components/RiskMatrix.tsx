import { useRef } from 'react'
import * as htmlToImage from 'html-to-image'
import { Download } from 'lucide-react'
import type { RiskItem } from '../types'

interface RiskMatrixProps {
  riskItems: RiskItem[]
}

export default function RiskMatrix({ riskItems }: RiskMatrixProps) {
  const matrixRef = useRef<HTMLDivElement>(null)

  const matrix: { [key: string]: RiskItem[] } = {}

  for (let severity = 1; severity <= 5; severity++) {
    for (let probability = 1; probability <= 5; probability++) {
      matrix[`${severity}-${probability}`] = []
    }
  }

  riskItems.forEach((item) => {
    if (item.severity && item.probability) {
      const key = `${item.severity}-${item.probability}`
      if (matrix[key]) {
        matrix[key].push(item)
      }
    }
  })

  const getCellColor = (severity: number, probability: number) => {
    const score = severity * probability
    if (score >= 15) return 'bg-red-500 hover:bg-red-600'
    if (score >= 8) return 'bg-amber-400 hover:bg-amber-500'
    return 'bg-emerald-500 hover:bg-emerald-600'
  }

  const severityLabels = ['Critica', 'Alta', 'Moderata', 'Bassa', 'Minima']
  const probabilityLabels = ['Rara', 'Improbabile', 'Occasionale', 'Probabile', 'Frequente']

  const exportPNG = () => {
    if (!matrixRef.current) return

    htmlToImage
      .toPng(matrixRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
      })
      .then((dataUrl) => {
        const link = document.createElement('a')
        link.download = 'pharmaT_matrice_rischio.png'
        link.href = dataUrl
        link.click()
      })
      .catch((err) => {
        console.error('Errore esportazione PNG:', err)
        alert('Errore durante l esportazione della matrice in PNG.')
      })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Matrice del Rischio (5x5)</h3>
          <p className="mt-1 text-sm text-slate-500">
            Distribuzione dei rischi per severita e probabilita.
          </p>
        </div>

        <button
          type="button"
          onClick={exportPNG}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-800"
        >
          <Download className="h-4 w-4" />
          Esporta PNG
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60">
        <div className="min-w-[760px] bg-white px-8 py-10" ref={matrixRef}>
          <div className="flex">
            <div className="w-28 flex-shrink-0" />
            <div className="mb-2 grid flex-1 grid-cols-5 gap-2">
              {probabilityLabels.map((label) => (
                <div
                  key={label}
                  className="flex h-9 items-center justify-center rounded-md bg-slate-50 px-2 text-center text-[11px] font-semibold uppercase leading-tight tracking-wide text-slate-600"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex">
            <div className="flex w-28 flex-shrink-0 flex-col gap-2">
              {severityLabels.map((label) => (
                <div
                  key={label}
                  className="flex h-[72px] items-center justify-end pr-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid flex-1 grid-cols-5 gap-2">
              {[5, 4, 3, 2, 1].map((severity) =>
                [1, 2, 3, 4, 5].map((probability) => {
                  const key = `${severity}-${probability}`
                  const cellRisks = matrix[key]
                  const count = cellRisks.length

                  return (
                    <div
                      key={key}
                      className={`group relative flex h-[72px] cursor-pointer items-center justify-center rounded-xl shadow-sm ring-1 ring-white/70 transition-colors ${getCellColor(
                        severity,
                        probability,
                      )}`}
                      title={cellRisks
                        .map((risk) => risk.risk_catalog_base?.name || risk.custom_risk_name)
                        .join('\n')}
                    >
                      {count > 0 && (
                        <span className="text-lg font-bold text-white drop-shadow-sm">{count}</span>
                      )}

                      {count > 0 && (
                        <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 transform group-hover:block">
                          <div className="max-w-xs rounded-lg bg-slate-950 px-3 py-2 text-xs text-white shadow-xl">
                            {cellRisks.slice(0, 3).map((risk, index) => (
                              <div key={index} className="whitespace-nowrap">
                                {risk.risk_catalog_base?.name || risk.custom_risk_name}
                              </div>
                            ))}
                            {count > 3 && (
                              <div className="mt-1 text-slate-400">+{count - 3} altri...</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }),
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-red-500" />
              <span className="text-sm text-slate-600">Alto (&gt;=15)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-amber-400" />
              <span className="text-sm text-slate-600">Medio (8-14)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-emerald-500" />
              <span className="text-sm text-slate-600">Basso (1-7)</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between text-sm text-slate-500">
            <span className="font-medium">Severita</span>
            <span className="font-medium">Probabilita</span>
          </div>
        </div>
      </div>
    </div>
  )
}
