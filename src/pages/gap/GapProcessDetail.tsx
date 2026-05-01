import { useParams } from 'react-router-dom'
import { Construction, Layers3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'

export default function GapProcessDetail() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="clinical-page">
      <PageHeader
        title="Dettaglio processo Gap"
        description="Vista futura della struttura processo, aree, attivita e standard collegati."
        eyebrow="Gap Analysis"
        icon={<Layers3 className="h-6 w-6" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Dettaglio processo in sviluppo</CardTitle>
          <CardDescription>
            Route predisposta per processo ID: <span className="font-mono">{id || 'N/D'}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Construction className="h-6 w-6" />}
            title="Vista processo non ancora operativa"
            description="In questa fase non vengono caricate aree, attivita o standard. La pagina serve solo a predisporre la navigazione del modulo."
          />
        </CardContent>
      </Card>
    </div>
  )
}
