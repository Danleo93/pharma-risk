import { AlertCircle, Layers3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ModuleKey } from '../../config/modules'
import { getModuleDefinition } from '../../config/modules'
import { Card, CardContent } from '../ui/Card'

interface ModuleUnavailableProps {
  moduleKey?: ModuleKey
  readOnlyWriteRoute?: boolean
  configurationError?: string | null
}

export function ModuleUnavailable({
  moduleKey,
  readOnlyWriteRoute = false,
  configurationError,
}: ModuleUnavailableProps) {
  const module = moduleKey ? getModuleDefinition(moduleKey) : null
  const title = readOnlyWriteRoute
    ? `${module?.label || 'Modulo'} in sola lettura`
    : module
      ? 'Modulo temporaneamente non disponibile'
      : 'Nessun modulo attualmente disponibile'
  const description = readOnlyWriteRoute
    ? 'La consultazione resta disponibile, ma non e possibile avviare una nuova analisi.'
    : configurationError
      || (module
        ? `${module.label} e stato temporaneamente disattivato. I dati esistenti restano conservati.`
        : 'Al momento non sono disponibili moduli operativi. Riprova piu tardi.')

  return (
    <div className="clinical-page flex min-h-[55vh] items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            {module ? <AlertCircle className="h-6 w-6" /> : <Layers3 className="h-6 w-6" />}
          </span>
          <h1 className="mt-4 text-xl font-semibold text-slate-950">{title}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Torna alla panoramica
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

