import { AlertCircle, BarChart3, ClipboardCheck, Clock } from 'lucide-react'

export default function RCADashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard RCA</h1>
        <p className="text-gray-500 mt-1">
          Area Analisi Reattiva predisposta per la Root Cause Analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Eventi analizzati</p>
              <p className="text-2xl font-bold text-gray-800">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Azioni aperte</p>
              <p className="text-2xl font-bold text-gray-800">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Stato modulo</p>
              <p className="text-2xl font-bold text-gray-800">In preparazione</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-start gap-4">
          <div className="bg-emerald-50 p-3 rounded-lg">
            <AlertCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Modulo RCA placeholder</h2>
            <p className="text-gray-500 mt-2 max-w-3xl">
              Questa sezione introduce la macro-area di Analisi Reattiva senza
              implementare ancora flussi, dati o persistenza RCA.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
