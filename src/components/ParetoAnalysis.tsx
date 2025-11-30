import { useState } from 'react'
import type { RiskItem, ActionPlan } from '../types'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface ParetoAnalysisProps {
  riskItems: RiskItem[]
  actions: ActionPlan[]
}

export default function ParetoAnalysis({ riskItems, actions }: ParetoAnalysisProps) {
  const [threshold, setThreshold] = useState(80)
  const [filterMode, setFilterMode] = useState<'all' | 'with_actions' | 'without_actions'>('all')
  const [isExpanded, setIsExpanded] = useState(true)

  // Ordina per RPN decrescente
  const sortedRisks = riskItems
    .filter(item => item.rpn !== null && item.rpn > 0)
    .sort((a, b) => (b.rpn || 0) - (a.rpn || 0))

  // Calcola totale RPN
  const totalRPN = sortedRisks.reduce((sum, item) => sum + (item.rpn || 0), 0)

  // Trova i rischi che spiegano la soglia %
  let cumulative = 0
  const thresholdRisks: (RiskItem & { cumulativePercent: number; hasActions: boolean })[] = []
  
  for (const risk of sortedRisks) {
    cumulative += (risk.rpn || 0)
    const cumulativePercent = Math.round((cumulative / totalRPN) * 100)
    const hasActions = actions.some(a => a.risk_item_id === risk.id)
    
    thresholdRisks.push({
      ...risk,
      cumulativePercent,
      hasActions
    })
    
    if (cumulativePercent >= threshold) break
  }

  // Applica filtro azioni
  const filteredRisks = thresholdRisks.filter(risk => {
    if (filterMode === 'with_actions') return risk.hasActions
    if (filterMode === 'without_actions') return !risk.hasActions
    return true
  })

  const getRiskClassColor = (riskClass: string | null) => {
    switch (riskClass) {
      case 'Alta': return 'bg-red-100 text-red-700 border-red-200'
      case 'Media': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'Bassa': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-500 border-gray-200'
    }
  }

  if (sortedRisks.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-800">Analisi Pareto Avanzata</h3>
            <p className="text-sm text-gray-500">
              {thresholdRisks.length} rischi spiegano il {threshold}% del rischio totale
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <>
          {/* Controls */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Soglia % */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soglia cumulativa: {threshold}%
                </label>
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="5"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>60%</span>
                  <span>95%</span>
                </div>
              </div>

              {/* Filtro Azioni */}
              <div className="sm:w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtro azioni
                </label>
                <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition ${
                      filterMode === 'all' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Tutti
                  </button>
                  <button
                    onClick={() => setFilterMode('with_actions')}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition ${
                      filterMode === 'with_actions' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Con azioni
                  </button>
                  <button
                    onClick={() => setFilterMode('without_actions')}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition ${
                      filterMode === 'without_actions' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Senza azioni
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista Rischi */}
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {filteredRisks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nessun rischio trovato con i filtri selezionati
              </div>
            ) : (
              filteredRisks.map((risk, index) => (
                <div key={risk.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <span className="text-gray-400 text-sm font-mono w-6">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-800">
                          {risk.risk_catalog_base?.name || risk.custom_risk_name}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRiskClassColor(risk.risk_class)}`}>
                          {risk.risk_class || 'N/D'}
                        </span>
                        {risk.hasActions && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Ha azioni
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {risk.risk_catalog_base?.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">RPN: {risk.rpn}</p>
                      <p className="text-sm text-orange-600">{risk.cumulativePercent}% cum.</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Visualizzati: <strong>{filteredRisks.length}</strong> rischi
              </span>
              <span className="text-gray-600">
                RPN totale analizzato: <strong>{filteredRisks.reduce((sum, r) => sum + (r.rpn || 0), 0)}</strong> / {totalRPN}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}