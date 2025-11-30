import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Bar, Cell } from 'recharts'
import type { RiskItem } from '../types'

interface ParetoChartProps {
  riskItems: RiskItem[]
}

export default function ParetoChart({ riskItems }: ParetoChartProps) {
  // Filtra solo i rischi con RPN calcolato e ordina per RPN decrescente
  const sortedRisks = riskItems
    .filter(item => item.rpn !== null && item.rpn > 0)
    .sort((a, b) => (b.rpn || 0) - (a.rpn || 0))
    .slice(0, 10) // Prendi i top 10

  // Calcola il totale RPN
  const totalRPN = sortedRisks.reduce((sum, item) => sum + (item.rpn || 0), 0)

  // Prepara i dati con percentuale cumulativa
  let cumulative = 0
  const data = sortedRisks.map((item) => {
    cumulative += (item.rpn || 0)
    return {
      name: (item.risk_catalog_base?.name || item.custom_risk_name || 'Rischio').substring(0, 20) + ((item.risk_catalog_base?.name || '').length > 20 ? '...' : ''),
      fullName: item.risk_catalog_base?.name || item.custom_risk_name || 'Rischio',
      rpn: item.rpn || 0,
      cumulative: Math.round((cumulative / totalRPN) * 100),
      riskClass: item.risk_class
    }
  })

  const getBarColor = (riskClass: string | null) => {
    switch (riskClass) {
      case 'Alta': return '#ef4444'
      case 'Media': return '#eab308'
      case 'Bassa': return '#22c55e'
      default: return '#94a3b8'
    }
  }

  if (sortedRisks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Analisi di Pareto (Top 10 RPN)</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Aggiungi rischi con punteggi per visualizzare il grafico
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Analisi di Pareto (Top 10 RPN)</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: 'RPN', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              domain={[0, 100]}
              label={{ value: '%', angle: 90, position: 'insideRight', fill: '#6b7280' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                      <p className="font-medium text-gray-800 text-sm mb-1">{item.fullName}</p>
                      <p className="text-sm text-gray-600">RPN: <span className="font-semibold">{item.rpn}</span></p>
                      <p className="text-sm text-gray-600">Cumulativo: <span className="font-semibold">{item.cumulative}%</span></p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar 
              yAxisId="left"
              dataKey="rpn" 
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.riskClass)} />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm text-gray-600">Alto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500"></div>
          <span className="text-sm text-gray-600">Medio</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-sm text-gray-600">Basso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-orange-500 rounded"></div>
          <span className="text-sm text-gray-600">% Cumulativa</span>
        </div>
      </div>
    </div>
  )
}