import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, ClipboardCheck, Search } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

export default function Home() {
  return (
    <div className="clinical-page">
      <PageHeader
        title="PhaRMA T"
        description="Strumento formativo, metodologico e documentale per risk management. Non utilizzare per decisioni cliniche dirette."
        eyebrow="Clinical risk management"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card elevated>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Analisi Proattiva</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Gestione FMEA dei rischi, catalogo, assessment e azioni correttive.
                </p>
              </div>
              <Badge variant="fmea">FMEA</Badge>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { to: '/fmea/dashboard', label: 'Dashboard' },
                { to: '/fmea/assessments', label: 'Assessment' },
                { to: '/fmea/risks', label: 'Catalogo Rischi' },
                { to: '/fmea/actions', label: 'Azioni Correttive' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition hover:border-sky-300 hover:bg-sky-50"
                >
                  <span className="font-medium text-slate-800">{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card elevated>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                  <Search className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Analisi Reattiva</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Area RCA per eventi, cause radice, 5 Whys e azioni conseguenti.
                </p>
              </div>
              <Badge variant="rca">RCA</Badge>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { to: '/rca/dashboard', label: 'Dashboard' },
                { to: '/rca/assessments', label: 'Assessment' },
                { to: '/rca/actions', label: 'Azioni' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition hover:border-orange-300 hover:bg-orange-50"
                >
                  <span className="font-medium text-slate-800">{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="mt-0.5 h-5 w-5 text-slate-400" />
                <p className="text-sm leading-6 text-slate-600">
                  La navigazione RCA mantiene separato il flusso reattivo da FMEA e prepara la base per futuri moduli.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
