import { useRef, type RefObject } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  getGapRiskPriorityLabel,
} from '../../lib/labels'
import { exportElementToPng } from '../../lib/exportImage'
import type { GapActivityEvaluation, RiskPriority } from '../../types/gap'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { Button } from '../ui/Button'

interface GapPriorityChartProps {
  evaluations: GapActivityEvaluation[]
  captureRef?: RefObject<HTMLDivElement | null>
}

const priorityOrder: RiskPriority[] = ['high', 'medium', 'low']

const colors: Record<RiskPriority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
}

export function GapPriorityChart({ evaluations, captureRef }: GapPriorityChartProps) {
  const exportRef = useRef<HTMLDivElement | null>(null)
  const chartRef = captureRef || exportRef
  const gapEvaluations = evaluations.filter((evaluation) =>
    ['non_compliant', 'partially_compliant'].includes(evaluation.compliance_status),
  )
  const data = priorityOrder
    .map((priority) => ({
      priority,
      name: getGapRiskPriorityLabel(priority),
      value: gapEvaluations.filter((evaluation) => evaluation.risk_priority === priority).length,
    }))
    .filter((item) => item.value > 0)

  return (
    <Card>
      <CardHeader
        actions={data.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={() => exportElementToPng(chartRef.current, 'gap_priorita_gap')}
          >
            PNG
          </Button>
        )}
      >
        <CardTitle>Priorità dei gap</CardTitle>
        <CardDescription>Distribuzione dei gap non conformi o parziali per priorità.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="h-6 w-6" />}
            title="Nessun gap prioritizzato"
            description="Le priorità saranno disponibili dopo la valutazione dei gap."
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
                >
                  {data.map((entry) => (
                    <Cell key={entry.priority} fill={colors[entry.priority]} />
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
