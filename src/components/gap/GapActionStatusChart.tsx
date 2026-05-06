import { useRef, type RefObject } from 'react'
import { CheckSquare, Download } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  GAP_ACTION_STATUS_OPTIONS,
  GAP_VERIFICATION_RESULT_OPTIONS,
} from '../../lib/labels'
import { exportElementToPng } from '../../lib/exportImage'
import type { GapAction } from '../../types/gap'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { Button } from '../ui/Button'

interface GapActionStatusChartProps {
  actions: GapAction[]
  mode: 'status' | 'verification'
  captureRef?: RefObject<HTMLDivElement | null>
}

export function GapActionStatusChart({ actions, mode, captureRef }: GapActionStatusChartProps) {
  const exportRef = useRef<HTMLDivElement | null>(null)
  const chartRef = captureRef || exportRef
  const options = mode === 'status'
    ? GAP_ACTION_STATUS_OPTIONS
    : GAP_VERIFICATION_RESULT_OPTIONS
  const data = options
    .map((option) => ({
      name: option.label,
      value: actions.filter((action) =>
        mode === 'status'
          ? action.status === option.value
          : action.verification_result === option.value,
      ).length,
    }))
    .filter((item) => item.value > 0)
  const title = mode === 'status' ? 'Stato azioni' : 'Esiti verifica efficacia'
  const description = mode === 'status'
    ? 'Distribuzione delle azioni correttive per stato operativo.'
    : 'Distribuzione degli esiti di verifica efficacia.'

  return (
    <Card>
      <CardHeader
        actions={data.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={() => exportElementToPng(
              chartRef.current,
              mode === 'status' ? 'gap_stato_azioni' : 'gap_verifica_efficacia',
            )}
          >
            PNG
          </Button>
        )}
      >
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="h-6 w-6" />}
            title={mode === 'status' ? 'Nessuna azione' : 'Nessuna verifica'}
            description={mode === 'status'
              ? 'Le azioni compariranno dopo la pianificazione dei gap.'
              : 'Gli esiti compariranno dopo la verifica delle azioni completate.'}
          />
        ) : (
          <div ref={chartRef} className="h-72 bg-white p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 12, right: 12, bottom: 24, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={64} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill={mode === 'status' ? '#0f766e' : '#0284c7'} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
