import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { RiskCatalogBase } from '../types'
import { Search, AlertTriangle, Filter } from 'lucide-react'

export default function RiskCatalog() {
  const [risks, setRisks] = useState<RiskCatalogBase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    fetchRisks()
  }, [])

  const fetchRisks = async () => {
    const { data, error } = await supabase
      .from('risk_catalog_base')
      .select('*')
      .order('category, name')

    if (!error) {
      setRisks(data || [])
    }
    setLoading(false)
  }

  const categories = [...new Set(risks.map(r => r.category))]

  const filteredRisks = risks.filter(risk => {
    const matchesSearch = !searchTerm || 
      risk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || risk.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedRisks = filteredRisks.reduce((acc, risk) => {
    if (!acc[risk.category]) {
      acc[risk.category] = []
    }
    acc[risk.category].push(risk)
    return acc
  }, {} as Record<string, RiskCatalogBase[]>)

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'UFA - Prescrizione': 'bg-purple-100 text-purple-700 border-purple-200',
      'UFA - Allestimento': 'bg-blue-100 text-blue-700 border-blue-200',
      'UFA - Trasporto': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'UFA - Somministrazione': 'bg-teal-100 text-teal-700 border-teal-200',
      'Magazzino': 'bg-amber-100 text-amber-700 border-amber-200',
      'Catena del Freddo': 'bg-sky-100 text-sky-700 border-sky-200',
      'DPC': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Farmaci Alto Rischio': 'bg-red-100 text-red-700 border-red-200',
      'Nutrizione Parenterale': 'bg-green-100 text-green-700 border-green-200',
      'Galenica': 'bg-orange-100 text-orange-700 border-orange-200',
      'Dispensazione Reparto': 'bg-pink-100 text-pink-700 border-pink-200',
      'Sperimentazioni': 'bg-violet-100 text-violet-700 border-violet-200',
      'Sistema': 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Catalogo Rischi</h1>
        <p className="text-gray-500 mt-1">
          {risks.length} rischi predefiniti basati su letteratura scientifica FMEA/HFMEA
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca rischio per nome, descrizione o categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="sm:w-64 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none appearance-none bg-white"
            >
              <option value="">Tutte le categorie</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          {filteredRisks.length} rischi trovati
          {(searchTerm || selectedCategory) && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}
              className="ml-2 text-sky-600 hover:text-sky-700"
            >
              Cancella filtri
            </button>
          )}
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {categories.map(cat => {
          const count = risks.filter(r => r.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
              className={`p-3 rounded-lg border text-left transition ${
                selectedCategory === cat 
                  ? 'ring-2 ring-sky-500 ' + getCategoryColor(cat)
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-800 text-sm truncate">{cat}</p>
              <p className="text-gray-500 text-xs mt-1">{count} rischi</p>
            </button>
          )
        })}
      </div>

      {/* Risks List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          Caricamento...
        </div>
      ) : filteredRisks.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nessun rischio trovato</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRisks).map(([category, categoryRisks]) => (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{category}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}>
                    {categoryRisks.length} rischi
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {categoryRisks.map((risk, index) => (
                  <div key={risk.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <span className="text-gray-400 text-sm font-mono w-8">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{risk.name}</p>
                        {risk.description && (
                          <p className="text-sm text-gray-500 mt-1">{risk.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}