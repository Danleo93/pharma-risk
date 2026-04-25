import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, ClipboardCheck, Search } from 'lucide-react'

export default function Home() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">PhaRMA T</h1>
        <p className="text-gray-500 mt-1">
          Seleziona l'area metodologica da utilizzare.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-sky-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Analisi Proattiva</h2>
              <p className="text-gray-500 mt-2">
                Gestione FMEA dei rischi, catalogo, assessment e azioni correttive.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <Link
              to="/fmea/dashboard"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition"
            >
              <span className="font-medium text-gray-800">Dashboard</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              to="/fmea/assessments"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition"
            >
              <span className="font-medium text-gray-800">Assessment</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              to="/fmea/risks"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition"
            >
              <span className="font-medium text-gray-800">Catalogo Rischi</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              to="/fmea/actions"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition"
            >
              <span className="font-medium text-gray-800">Azioni Correttive</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Analisi Reattiva</h2>
              <p className="text-gray-500 mt-2">
                Area predisposta per RCA, eventi, cause radice e azioni conseguenti.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
              Placeholder
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <Link
              to="/rca/dashboard"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition"
            >
              <span className="font-medium text-gray-800">Dashboard</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              to="/rca/assessments"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition"
            >
              <span className="font-medium text-gray-800">Assessment</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              to="/rca/actions"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition"
            >
              <span className="font-medium text-gray-800">Azioni</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
          </div>

          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="w-5 h-5 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-600">
                La struttura di navigazione RCA e' pronta. La logica applicativa verra'
                introdotta in una fase successiva.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
