import { useParams } from 'react-router-dom'
import { BarChart3, ClipboardList, Construction, FileText, ListChecks } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'

export default function GapAssessmentDetail() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="clinical-page">
      <PageHeader
        title="Dettaglio assessment Gap"
        description="Contenitore futuro del workflow Gap Analysis."
        eyebrow="Gap Analysis"
        icon={<ClipboardList className="h-6 w-6" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Workflow assessment in sviluppo</CardTitle>
          <CardDescription>
            Route predisposta per assessment ID: <span className="font-mono">{id || 'N/D'}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Construction className="h-6 w-6" />}
            title="Dettaglio non ancora operativo"
            description="Questa pagina non esegue query e non modifica dati. Servira come contenitore per valutazioni, gap, azioni e report."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FileText className="mb-3 h-5 w-5 text-teal-700" />
              <h2 className="text-sm font-semibold text-slate-900">Valutazioni</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Stato corrente, target, gap e priorita per ogni attivita selezionata.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <ListChecks className="mb-3 h-5 w-5 text-teal-700" />
              <h2 className="text-sm font-semibold text-slate-900">Azioni</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Piano di adeguamento con avanzamento e verifica di efficacia.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <BarChart3 className="mb-3 h-5 w-5 text-teal-700" />
              <h2 className="text-sm font-semibold text-slate-900">Report</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Sintesi documentale e indicatori per audit e riesame.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
