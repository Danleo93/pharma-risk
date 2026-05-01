import { Construction, GitBranch, Layers3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'

export default function GapProcesses() {
  return (
    <div className="clinical-page">
      <PageHeader
        title="Processi Gap"
        description="Libreria riutilizzabile Processi, Aree e Attivita."
        eyebrow="Gap Analysis"
        icon={<Layers3 className="h-6 w-6" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Catalogo processi in sviluppo</CardTitle>
          <CardDescription>
            Questa sezione conterra la libreria strutturale usata dagli assessment Gap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Construction className="h-6 w-6" />}
            title="Gestione processi non ancora attiva"
            description="La pagina e predisposta per la futura gestione di processi, aree e attivita, senza logica CRUD in questa fase."
          />

          <div className="mt-6 rounded-xl border border-teal-100 bg-teal-50 p-5">
            <div className="flex items-start gap-3">
              <GitBranch className="mt-1 h-5 w-5 shrink-0 text-teal-700" />
              <div>
                <h2 className="text-sm font-semibold text-teal-950">Struttura prevista</h2>
                <p className="mt-1 text-sm leading-6 text-teal-800">
                  Ogni processo potra contenere piu aree; ogni area potra contenere attivita con
                  stato target, operatore responsabile e standard collegati.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
