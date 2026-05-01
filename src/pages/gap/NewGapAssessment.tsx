import { ClipboardList, Construction, FilePlus2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'

export default function NewGapAssessment() {
  return (
    <div className="clinical-page">
      <PageHeader
        title="Nuovo assessment Gap"
        description="Creazione guidata di un assessment Gap Analysis."
        eyebrow="Gap Analysis"
        icon={<FilePlus2 className="h-6 w-6" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Wizard assessment in sviluppo</CardTitle>
          <CardDescription>
            Questa sezione ospitera la selezione dei processi, la generazione delle valutazioni e
            l'avvio del workflow di analisi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Construction className="h-6 w-6" />}
            title="Funzionalita non ancora attiva"
            description="In questa fase la pagina e un placeholder navigabile. Non vengono creati record e non viene eseguita alcuna operazione sul database."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ClipboardList className="mb-3 h-5 w-5 text-teal-700" />
              <h2 className="text-sm font-semibold text-slate-900">Selezione processi</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Scelta dei processi e delle aree da includere nell'assessment.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ClipboardList className="mb-3 h-5 w-5 text-teal-700" />
              <h2 className="text-sm font-semibold text-slate-900">Valutazioni attivita</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Creazione delle righe di valutazione per le attivita selezionate.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ClipboardList className="mb-3 h-5 w-5 text-teal-700" />
              <h2 className="text-sm font-semibold text-slate-900">Piano azioni</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Collegamento dei gap rilevati alle azioni di miglioramento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
