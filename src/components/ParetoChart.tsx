import { useState, useRef } from 'react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Bar,
  Cell
} from 'recharts'
import { toPng } from 'html-to-image'
import { Image as ImageIcon } from 'lucide-react'
import type { RiskItem } from '../types'

interface ParetoChartProps {
  riskItems: RiskItem[]
}

export default function ParetoChart({ riskItems }: ParetoChartProps) {
  const [displayMode, setDisplayMode] = useState<'all' | '10' | '20'>('all')
  const exportRef = useRef<HTMLDivElement | null>(null)

  // ------------ PREPARAZIONE DATI ------------

  // Filtra solo i rischi con RPN calcolato e ordina per RPN decrescente
  const sortedRisks = riskItems
    .filter(item => item.rpn !== null && item.rpn > 0)
    .sort((a, b) => (b.rpn || 0) - (a.rpn || 0))

  // Applica il limite in base al displayMode
  const limitedRisks =
    displayMode === 'all'
      ? sortedRisks
      : sortedRisks.slice(0, displayMode === '10' ? 10 : 20)

  // Calcola il totale RPN
  const totalRPN = sortedRisks.reduce((sum, item) => sum + (item.rpn || 0), 0) || 1

  // Prepara i dati con percentuale cumulativa
  let cumulative = 0
  const data = limitedRisks.map(item => {
    cumulative += item.rpn || 0
    const fullName =
      item.risk_catalog_base?.name || item.custom_risk_name || 'Rischio'
    const shortName =
      fullName.length > 15 ? fullName.substring(0, 15) + '…' : fullName

    return {
      name: shortName,
      fullName,
      rpn: item.rpn || 0,
      cumulative: Math.round((cumulative / totalRPN) * 100),
      riskClass: item.risk_class
    }
  })

  const getBarColor = (riskClass: string | null) => {
    switch (riskClass) {
      case 'Alta':
        return '#ef4444'
      case 'Media':
        return '#eab308'
      case 'Bassa':
        return '#22c55e'
      default:
        return '#94a3b8'
    }
  }

  // ------------ EXPORT PNG ------------

  const handleExportPNG = async () => {
    if (!exportRef.current) return

    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      })

      const link = document.createElement('a')
      link.download = 'pharmaT_pareto.png'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Errore durante esportazione PNG Pareto:', error)
    }
  }

  // ------------ RENDER ------------

  if (sortedRisks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Analisi di Pareto</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Aggiungi rischi con punteggi per visualizzare il grafico
        </div>
      </div>
    )
  }

  // larghezza minima del contenuto esportato (più barre = più largo)
  const contentMinWidth = Math.max(600, data.length * 60)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header con pulsanti e PNG blu come la matrice */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Analisi di Pareto</h3>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDisplayMode('10')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                displayMode === '10'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Top 10
            </button>
            <button
              onClick={() => setDisplayMode('20')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                displayMode === '20'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Top 20
            </button>
            <button
              onClick={() => setDisplayMode('all')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                displayMode === 'all'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Tutti ({sortedRisks.length})
            </button>
          </div>

          {/* Bottone PNG in stile "primario" come la matrice */}
          <button
            onClick={handleExportPNG}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
          >
            <ImageIcon className="w-4 h-4" />
            PNG
          </button>
        </div>
      </div>

      {/* Contenitore scrollabile orizzontale */}
      <div className="h-[500px] overflow-x-auto">
        {/* Contenuto effettivamente esportato: ha minWidth grande, nessun overflow */}
        <div
          ref={exportRef}
          className="px-4 pt-2 pb-6"
          style={{ minWidth: contentMinWidth }}
        >
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  label={{
                    value: 'RPN',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#6b7280'
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  domain={[0, 100]}
                  label={{
                    value: '%',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#6b7280'
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as any
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
                          <p className="font-medium text-gray-800 text-sm mb-1">
                            {item.fullName}
                          </p>
                          <p className="text-sm text-gray-600">
                            RPN:{' '}
                            <span className="font-semibold">{item.rpn}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Cumulativo:{' '}
                            <span className="font-semibold">
                              {item.cumulative}%
                            </span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar yAxisId="left" dataKey="rpn" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(entry.riskClass)}
                    />
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

          {/* Legenda dentro all’area esportata */}
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
              <div className="w-6 h-[2px] bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">% Cumulativa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
