import { useRef, type RefObject } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { calculateAreaCompliance } from '../../lib/gapScoring'
import { exportElementToPng } from '../../lib/exportImage'
import type { GapActivityEvaluation } from '../../types/gap'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { ClipboardList, Download } from 'lucide-react'
import { Button } from '../ui/Button'

interface GapComplianceByDomainChartProps {
  evaluations: GapActivityEvaluation[]
  captureRef?: RefObject<HTMLDivElement | null>
}

export function GapComplianceByDomainChart({ evaluations, captureRef }: GapComplianceByDomainChartProps) {
  const exportRef = useRef<HTMLDivElement | null>(null)
  const chartRef = captureRef || exportRef
  const data = calculateAreaCompliance(evaluations)
    .filter((item) => item.evaluated > 0)
    .map((item) => ({
      name: item.area_name,
      process: item.process_name,
      compliance: item.compliance_percentage,
      evaluated: item.evaluated,
      total: item.total,
    }))

  return (
    <Card>
      <CardHeader
        actions={data.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={() => exportElementToPng(chartRef.current, 'gap_compliance_dominio_sezione')}
          >
            PNG
          </Button>
        )}
      >
        <CardTitle>Compliance per Dominio/Sezione</CardTitle>
        <CardDescription>Percentuale calcolata sulle valutazioni effettivamente applicabili.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title="Nessun dominio valutabile"
            description="La compliance per Dominio/Sezione comparira dopo almeno una valutazione conforme, parziale o non conforme."
          />
        ) : (
          <div ref={chartRef} className="h-80 bg-white p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 12, right: 12, bottom: 48, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={78} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Compliance']}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload
                    return item ? `${label} (${item.evaluated}/${item.total} valutate)` : String(label)
                  }}
                />
                <Bar dataKey="compliance" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
