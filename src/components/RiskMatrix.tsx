import type { RiskItem } from '../types'

interface RiskMatrixProps {
  riskItems: RiskItem[]
}

export default function RiskMatrix({ riskItems }: RiskMatrixProps) {
  // Crea la matrice 5x5
  const matrix: { [key: string]: RiskItem[] } = {}
  
  // Inizializza tutte le celle
  for (let s = 1; s <= 5; s++) {
    for (let p = 1; p <= 5; p++) {
      matrix[`${s}-${p}`] = []
    }
  }

  // Popola la matrice con i rischi
  riskItems.forEach(item => {
    if (item.severity && item.probability) {
      const key = `${item.severity}-${item.probability}`
      if (matrix[key]) {
        matrix[key].push(item)
      }
    }
  })

  // Colori delle celle basati su Hazard Score (S × P)
  const getCellColor = (severity: number, probability: number) => {
    const score = severity * probability
    if (score >= 15) return 'bg-red-500 hover:bg-red-600'
    if (score >= 8) return 'bg-yellow-400 hover:bg-yellow-500'
    return 'bg-green-500 hover:bg-green-600'
  }

  const severityLabels = ['Critica', 'Alta', 'Moderata', 'Bassa', 'Minima']
  const probabilityLabels = ['Rara', 'Improbabile', 'Occasionale', 'Probabile', 'Frequente']

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Matrice del Rischio (5×5)</h3>
      
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Header Probabilità */}
          <div className="flex">
            <div className="w-24 flex-shrink-0"></div>
            <div className="flex-1 grid grid-cols-5 gap-1 mb-1">
              {probabilityLabels.map((label, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-600 px-1">
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Matrice */}
          <div className="flex">
            {/* Labels Severità */}
            <div className="w-24 flex-shrink-0 flex flex-col gap-1">
              {severityLabels.map((label, i) => (
                <div key={i} className="h-16 flex items-center justify-end pr-2 text-xs font-medium text-gray-600">
                  {label}
                </div>
              ))}
            </div>

            {/* Celle */}
            <div className="flex-1 grid grid-cols-5 gap-1">
              {[5, 4, 3, 2, 1].map(severity => (
                [1, 2, 3, 4, 5].map(probability => {
                  const key = `${severity}-${probability}`
                  const cellRisks = matrix[key]
                  const count = cellRisks.length
                  
                  return (
                    <div
                      key={key}
                      className={`
                        h-16 rounded-lg flex items-center justify-center
                        ${getCellColor(severity, probability)}
                        transition-colors cursor-pointer relative group
                      `}
                      title={cellRisks.map(r => r.risk_catalog_base?.name || r.custom_risk_name).join('\n')}
                    >
                      {count > 0 && (
                        <span className="text-white font-bold text-lg">
                          {count}
                        </span>
                      )}
                      
                      {/* Tooltip */}
                      {count > 0 && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs">
                            {cellRisks.slice(0, 3).map((r, i) => (
                              <div key={i} className="whitespace-nowrap">
                                • {r.risk_catalog_base?.name || r.custom_risk_name}
                              </div>
                            ))}
                            {count > 3 && (
                              <div className="text-gray-400 mt-1">
                                +{count - 3} altri...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              ))}
            </div>
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm text-gray-600">Alto (≥15)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-400"></div>
              <span className="text-sm text-gray-600">Medio (8-14)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-gray-600">Basso (1-7)</span>
            </div>
          </div>

          {/* Assi labels */}
          <div className="flex justify-between mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span className="font-medium">↑ Severità</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Probabilità →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}