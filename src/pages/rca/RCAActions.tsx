import { AlertCircle, Calendar, CheckCircle, Clock } from 'lucide-react'

export default function RCAActions() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Azioni Correttive RCA</h1>
          <p className="text-gray-500 mt-1">
            Spazio dedicato alle azioni conseguenti alle analisi reattive.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="flex items-center gap-2 bg-gray-200 text-gray-500 px-5 py-3 rounded-lg font-medium cursor-not-allowed"
        >
          Nuova Azione
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Totale</p>
          <p className="text-2xl font-bold text-gray-800">0</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Pianificate</p>
          <p className="text-2xl font-bold text-blue-600">0</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">In corso</p>
          <p className="text-2xl font-bold text-yellow-600">0</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Completate</p>
          <p className="text-2xl font-bold text-green-600">0</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Piano azioni RCA</h2>
        </div>
        <div className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800">Nessuna azione RCA presente</h3>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            Le azioni correttive RCA saranno collegate agli eventi e alle cause radice
            quando il modulo di Analisi Reattiva verra' implementato.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
              <Calendar className="w-4 h-4" />
              Pianificazione
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg">
              <Clock className="w-4 h-4" />
              Monitoraggio
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              Chiusura
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
