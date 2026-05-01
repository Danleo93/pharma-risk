import { BookMarked, Construction } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'

export default function GapStandards() {
  return (
    <div className="clinical-page">
      <PageHeader
        title="Norme e standard"
        description="Catalogo dei riferimenti normativi e procedurali collegabili alle attivita Gap."
        eyebrow="Gap Analysis"
        icon={<BookMarked className="h-6 w-6" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Catalogo standard in sviluppo</CardTitle>
          <CardDescription>
            Questa sezione ospitera norme, linee guida, procedure interne e riferimenti specifici.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Construction className="h-6 w-6" />}
            title="Gestione norme non ancora attiva"
            description="In questa fase la pagina e un placeholder. Non vengono eseguite query e non vengono modificati dati."
          />
        </CardContent>
      </Card>
    </div>
  )
}
