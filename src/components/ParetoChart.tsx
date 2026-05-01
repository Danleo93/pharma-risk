import { useRef, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toPng } from 'html-to-image'
import { BarChart3, Image as ImageIcon } from 'lucide-react'
import type { RiskItem } from '../types'

interface ParetoChartProps {
  riskItems: RiskItem[]
}

export default function ParetoChart({ riskItems }: ParetoChartProps) {
  const [displayMode, setDisplayMode] = useState<'all' | '10' | '20'>('all')
  const exportRef = useRef<HTMLDivElement | null>(null)

  const sortedRisks = riskItems
    .filter((item) => item.rpn !== null && item.rpn > 0)
    .sort((a, b) => (b.rpn || 0) - (a.rpn || 0))

  const limitedRisks =
    displayMode === 'all'
      ? sortedRisks
      : sortedRisks.slice(0, displayMode === '10' ? 10 : 20)

  const totalRPN = sortedRisks.reduce((sum, item) => sum + (item.rpn || 0), 0) || 1

  let cumulative = 0
  const data = limitedRisks.map((item, index) => {
    cumulative += item.rpn || 0
    const fullName = item.risk_catalog_base?.name || item.custom_risk_name || 'Rischio'

    return {
      name: `#${index + 1}`,
      fullName,
      rpn: item.rpn || 0,
      cumulative: Math.round((cumulative / totalRPN) * 100),
      riskClass: item.risk_class,
      rank: index + 1,
    }
  })

  const getBarColor = (riskClass: string | null) => {
    switch (riskClass) {
      case 'Alta':
        return '#ef4444'
      case 'Media':
        return '#f59e0b'
      case 'Bassa':
        return '#10b981'
      default:
        return '#94a3b8'
    }
  }

  const handleExportPNG = async () => {
    if (!exportRef.current) return

    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      })

      const link = document.createElement('a')
      link.download = 'pharmaT_pareto.png'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Errore durante esportazione PNG Pareto:', error)
    }
  }

  if (sortedRisks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-sky-50 p-2 text-sky-700">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Analisi di Pareto</h3>
            <p className="text-sm text-slate-500">Prioritizzazione dei rischi per RPN.</p>
          </div>
        </div>
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-sm text-slate-500">
          Aggiungi rischi con punteggi per visualizzare il grafico.
        </div>
      </div>
    )
  }

  const contentMinWidth = Math.max(760, data.length * 72)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Analisi di Pareto</h3>
          <p className="mt-1 text-sm text-slate-500">
            Evidenzia i rischi che contribuiscono maggiormente al profilo RPN complessivo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 bg-slate-100/80 p-1">
            <button
              onClick={() => setDisplayMode('10')}
              className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                displayMode === '10'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Top 10
            </button>
            <button
              onClick={() => setDisplayMode('20')}
              className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                displayMode === '20'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Top 20
            </button>
            <button
              onClick={() => setDisplayMode('all')}
              className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                displayMode === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tutti ({sortedRisks.length})
            </button>
          </div>

          <button
            onClick={handleExportPNG}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-800"
          >
            <ImageIcon className="h-4 w-4" />
            PNG
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50">
        <div
          ref={exportRef}
          className="bg-white px-5 pb-6 pt-4"
          style={{ minWidth: contentMinWidth }}
        >
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 36 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  height={42}
                  interval={0}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  label={{
                    value: 'RPN',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  domain={[0, 100]}
                  label={{
                    value: '%',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#64748b',
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as any
                      return (
                        <div className="max-w-xs rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xl">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                            Rischio #{item.rank}
                          </p>
                          <p className="mb-1 font-medium text-slate-900">{item.fullName}</p>
                          <p className="text-slate-600">
                            RPN: <span className="font-semibold text-slate-900">{item.rpn}</span>
                          </p>
                          <p className="text-slate-600">
                            Cumulativo:{' '}
                            <span className="font-semibold text-slate-900">{item.cumulative}%</span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar yAxisId="left" dataKey="rpn" radius={[5, 5, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.riskClass)} />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Legenda rischi asse X</p>
              <p className="text-xs text-slate-500">
                I codici # evitano troncamenti; le descrizioni complete sono riportate qui.
              </p>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {data.map((item) => (
                <div
                  key={item.rank}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-sky-100 text-xs font-bold text-sky-700">
                    #{item.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-slate-900">{item.fullName}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>RPN: {item.rpn}</span>
                      <span>Cumulativo: {item.cumulative}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-red-500" />
              <span className="text-sm text-slate-600">Alto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-amber-500" />
              <span className="text-sm text-slate-600">Medio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-emerald-500" />
              <span className="text-sm text-slate-600">Basso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-[2px] w-6 rounded bg-orange-500" />
              <span className="text-sm text-slate-600">% Cumulativa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
