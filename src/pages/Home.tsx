import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, ClipboardCheck, Search } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

const modules = [
  {
    tag: 'FMEA',
    title: 'Analisi Proattiva',
    description: 'Valutazione preventiva dei rischi, catalogo, assessment e azioni correttive.',
    icon: AlertTriangle,
    iconClass: 'bg-sky-50 text-sky-700 ring-sky-100',
    badgeVariant: 'fmea',
    topClass: 'bg-sky-500',
    linkClass: 'hover:border-sky-300 hover:bg-sky-50 focus-visible:ring-sky-500',
    links: [
      { to: '/fmea/dashboard', label: 'Dashboard' },
      { to: '/fmea/assessments', label: 'Assessment' },
      { to: '/fmea/risks', label: 'Catalogo rischi' },
      { to: '/fmea/actions', label: 'Azioni correttive' },
    ],
  },
  {
    tag: 'RCA',
    title: 'Analisi Reattiva',
    description: 'Analisi di eventi, cause radice, 5 Whys e piano di azioni conseguenti.',
    icon: Search,
    iconClass: 'bg-amber-50 text-amber-700 ring-amber-100',
    badgeVariant: 'rca',
    topClass: 'bg-amber-500',
    linkClass: 'hover:border-amber-300 hover:bg-amber-50 focus-visible:ring-amber-500',
    links: [
      { to: '/rca/dashboard', label: 'Dashboard' },
      { to: '/rca/assessments', label: 'Assessment' },
      { to: '/rca/actions', label: 'Azioni correttive' },
    ],
  },
  {
    tag: 'GAP',
    title: 'Gap Analysis',
    description: 'Verifica di conformità, requisiti, norme, gap operativi e azioni correttive.',
    icon: ClipboardCheck,
    iconClass: 'bg-teal-50 text-teal-700 ring-teal-100',
    badgeVariant: 'success',
    topClass: 'bg-teal-500',
    linkClass: 'hover:border-teal-300 hover:bg-teal-50 focus-visible:ring-teal-500',
    links: [
      { to: '/gap/dashboard', label: 'Dashboard' },
      { to: '/gap/assessments', label: 'Assessment' },
      { to: '/gap/processes', label: 'Processi' },
      { to: '/gap/standards', label: 'Norme' },
      { to: '/gap/actions', label: 'Azioni correttive' },
    ],
  },
] as const

export default function Home() {
  return (
    <div className="clinical-page space-y-8">
      <PageHeader
        title="PhaRMA T"
        description="Strumento formativo, metodologico e documentale per risk management. Non utilizzare per decisioni cliniche dirette."
        eyebrow="Clinical risk management"
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Suite metodologica
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              Tre percorsi integrati per documentare rischio, cause e conformità
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Accedi rapidamente ai moduli FMEA, RCA e Gap Analysis mantenendo separati i workflow operativi.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[420px]">
            {modules.map((module) => {
              const Icon = module.icon
              return (
                <div
                  key={module.tag}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${module.iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{module.tag}</p>
                    <p className="text-sm font-semibold text-slate-800">{module.title}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Card key={module.tag} elevated className="overflow-hidden">
              <div className={`h-1.5 ${module.topClass}`} />
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${module.iconClass}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">{module.title}</h2>
                    <p className="mt-2 min-h-[3rem] text-sm leading-6 text-slate-500">{module.description}</p>
                  </div>
                  <Badge variant={module.badgeVariant}>
                    {module.tag}
                  </Badge>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {module.links.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex min-h-14 items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${module.linkClass}`}
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
