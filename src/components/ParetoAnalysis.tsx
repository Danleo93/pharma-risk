import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import type { ActionPlan, RiskItem } from '../types'

interface ParetoAnalysisProps {
  riskItems: RiskItem[]
  actions: ActionPlan[]
}

export default function ParetoAnalysis({ riskItems, actions }: ParetoAnalysisProps) {
  const [threshold, setThreshold] = useState(80)
  const [filterMode, setFilterMode] = useState<'all' | 'with_actions' | 'without_actions'>('all')
  const [isExpanded, setIsExpanded] = useState(true)

  const sortedRisks = riskItems
    .filter((item) => item.rpn !== null && item.rpn > 0)
    .sort((a, b) => (b.rpn || 0) - (a.rpn || 0))

  const totalRPN = sortedRisks.reduce((sum, item) => sum + (item.rpn || 0), 0)

  let cumulative = 0
  const thresholdRisks: (RiskItem & { cumulativePercent: number; hasActions: boolean })[] = []

  for (const risk of sortedRisks) {
    cumulative += risk.rpn || 0
    const cumulativePercent = Math.round((cumulative / totalRPN) * 100)
    const hasActions = actions.some((action) => action.risk_item_id === risk.id)

    thresholdRisks.push({
      ...risk,
      cumulativePercent,
      hasActions,
    })

    if (cumulativePercent >= threshold) break
  }

  const filteredRisks = thresholdRisks.filter((risk) => {
    if (filterMode === 'with_actions') return risk.hasActions
    if (filterMode === 'without_actions') return !risk.hasActions
    return true
  })

  const getRiskClassColor = (riskClass: string | null) => {
    switch (riskClass) {
      case 'Alta':
        return 'border-red-200 bg-red-100 text-red-700'
      case 'Media':
        return 'border-amber-200 bg-amber-100 text-amber-700'
      case 'Bassa':
        return 'border-emerald-200 bg-emerald-100 text-emerald-700'
      default:
        return 'border-slate-200 bg-slate-100 text-slate-500'
    }
  }

  if (sortedRisks.length === 0) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-5 text-left transition hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Analisi Pareto Avanzata</h3>
            <p className="mt-1 text-sm text-slate-500">
              {thresholdRisks.length} rischi spiegano il {threshold}% del rischio totale
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <>
          <div className="border-t border-slate-100 bg-slate-50/70 p-5">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Soglia cumulativa: {threshold}%
                </label>
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="5"
                  value={threshold}
                  onChange={(event) => setThreshold(parseInt(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-amber-500"
                />
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>60%</span>
                  <span>95%</span>
                </div>
              </div>

              <div className="sm:w-72">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Filtro azioni
                </label>
                <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition ${
                      filterMode === 'all'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Tutti
                  </button>
                  <button
                    onClick={() => setFilterMode('with_actions')}
                    className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition ${
                      filterMode === 'with_actions'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Con azioni
                  </button>
                  <button
                    onClick={() => setFilterMode('without_actions')}
                    className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition ${
                      filterMode === 'without_actions'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Senza azioni
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {filteredRisks.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Nessun rischio trovato con i filtri selezionati.
              </div>
            ) : (
              filteredRisks.map((risk, index) => (
                <div key={risk.id} className="p-4 transition hover:bg-slate-50">
                  <div className="flex items-start gap-4">
                    <span className="w-6 font-mono text-sm text-slate-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {risk.risk_catalog_base?.name || risk.custom_risk_name}
                        </p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getRiskClassColor(
                            risk.risk_class,
                          )}`}
                        >
                          {risk.risk_class || 'N/D'}
                        </span>
                        {risk.hasActions && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                            Ha azioni
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{risk.risk_catalog_base?.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">RPN: {risk.rpn}</p>
                      <p className="text-sm font-medium text-amber-700">
                        {risk.cumulativePercent}% cum.
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Visualizzati: <strong>{filteredRisks.length}</strong> rischi
              </span>
              <span>
                RPN totale analizzato:{' '}
                <strong>{filteredRisks.reduce((sum, risk) => sum + (risk.rpn || 0), 0)}</strong> /{' '}
                {totalRPN}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
