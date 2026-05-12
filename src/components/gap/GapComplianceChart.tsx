import { useRef, type RefObject } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  getComplianceStatusLabel,
} from '../../lib/labels'
import { exportElementToPng } from '../../lib/exportImage'
import type { ComplianceStatus, GapActivityEvaluation } from '../../types/gap'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { ClipboardList, Download } from 'lucide-react'
import { Button } from '../ui/Button'

interface GapComplianceChartProps {
  evaluations: GapActivityEvaluation[]
  captureRef?: RefObject<HTMLDivElement | null>
}

const statusOrder: ComplianceStatus[] = [
  'compliant',
  'partially_compliant',
  'non_compliant',
  'not_evaluated',
  'not_applicable',
]

const colors: Record<ComplianceStatus, string> = {
  compliant: '#10b981',
  partially_compliant: '#f59e0b',
  non_compliant: '#ef4444',
  not_evaluated: '#94a3b8',
  not_applicable: '#cbd5e1',
}

const RADIAN = Math.PI / 180

export function GapComplianceChart({ evaluations, captureRef }: GapComplianceChartProps) {
  const exportRef = useRef<HTMLDivElement | null>(null)
  const chartRef = captureRef || exportRef
  const data = statusOrder
    .map((status) => ({
      status,
      name: getComplianceStatusLabel(status),
      value: evaluations.filter((evaluation) => evaluation.compliance_status === status).length,
    }))
    .filter((item) => item.value > 0)
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const renderPercentageLabel = (props: {
    cx?: number
    cy?: number
    midAngle?: number
    innerRadius?: number
    outerRadius?: number
    value?: number
  }) => {
    const {
      cx = 0,
      cy = 0,
      midAngle = 0,
      innerRadius = 0,
      outerRadius = 0,
      value = 0,
    } = props
    if (total === 0 || value === 0) return null

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const percentage = Math.round((value / total) * 100)

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[11px] font-semibold"
      >
        {percentage}%
      </text>
    )
  }

  return (
    <Card>
      <CardHeader
        actions={data.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={() => exportElementToPng(chartRef.current, 'gap_distribuzione_conformita')}
          >
            PNG
          </Button>
        )}
      >
        <CardTitle>Distribuzione conformità</CardTitle>
        <CardDescription>Stato complessivo delle valutazioni Gap.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title="Nessuna valutazione"
            description="I dati di conformità compariranno dopo la creazione degli assessment."
          />
        ) : (
          <div ref={chartRef} className="h-72 bg-white p-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                  label={renderPercentageLabel}
                  labelLine={false}
                  isAnimationActive={false}
                >
                  {data.map((entry) => (
                    <Cell key={entry.status} fill={colors[entry.status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
