import { AlertCircle, FileText, Plus } from 'lucide-react'

export default function RCAAssessments() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Assessment RCA</h1>
          <p className="text-gray-500 mt-1">
            Registro predisposto per le future analisi reattive.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="flex items-center gap-2 bg-gray-200 text-gray-500 px-5 py-3 rounded-lg font-medium cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Nuovo Assessment
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Totale</p>
          <p className="text-2xl font-bold text-gray-800">0</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Bozze</p>
          <p className="text-2xl font-bold text-gray-600">0</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">In corso</p>
          <p className="text-2xl font-bold text-yellow-600">0</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Completati</p>
          <p className="text-2xl font-bold text-green-600">0</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-800">Nessun assessment RCA disponibile</h2>
        <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
          La pagina e' pronta per ospitare gli assessment di Analisi Reattiva.
          La creazione e la gestione RCA saranno introdotte in una fase successiva.
        </p>
        <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
          <AlertCircle className="w-4 h-4" />
          Placeholder professionale
        </div>
      </div>
    </div>
  )
}
