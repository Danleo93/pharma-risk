import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { MODULE_DEFINITIONS } from '../config/modules'
import { useModuleConfig } from '../context/useModuleConfig'

export default function Home() {
  const { error, getStatus, isVisible } = useModuleConfig()
  const modules = MODULE_DEFINITIONS.filter((module) => isVisible(module.key))

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
              Accedi rapidamente ai moduli disponibili mantenendo separati i workflow operativi.
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

      {modules.length === 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Nessun modulo attualmente disponibile</h2>
          <p className="mt-2 text-sm text-slate-600">
            {error || 'I moduli metodologici sono temporaneamente disattivati.'}
          </p>
        </section>
      )}

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
                    <p className="mt-2 min-h-[3rem] text-sm leading-6 text-slate-500">{module.homeDescription}</p>
                  </div>
                  <Badge variant={module.badgeVariant}>
                    {module.tag}
                  </Badge>
                  {getStatus(module.key) === 'read_only' && (
                    <Badge variant="warning">Sola lettura</Badge>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {module.navigation.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
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
