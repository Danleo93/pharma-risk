import { CheckSquare, Construction, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'

export default function GapActions() {
  return (
    <div className="clinical-page">
      <PageHeader
        title="Azioni Gap"
        description="Piano di adeguamento e verifica di efficacia delle azioni Gap Analysis."
        eyebrow="Gap Analysis"
        icon={<CheckSquare className="h-6 w-6" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Workflow azioni in sviluppo</CardTitle>
          <CardDescription>
            Questa sezione conterra le azioni collegate alle valutazioni e ai gap rilevati.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Construction className="h-6 w-6" />}
            title="Azioni non ancora operative"
            description="Il workflow planned, in_progress, completed e verifica di efficacia sara implementato in una fase successiva."
          />

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-teal-700" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Verifica di efficacia prevista</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Dopo il completamento, ogni azione potra essere verificata come efficace,
                  parzialmente efficace o non efficace.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
