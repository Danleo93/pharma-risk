import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { RiskCatalogBase, UserCustomRisk } from '../types'
import { Search, AlertTriangle, Filter, Plus, Trash2, X } from 'lucide-react'

export default function RiskCatalog() {
  const { user } = useAuth()
  const [risks, setRisks] = useState<RiskCatalogBase[]>([])
  const [userCustomRisks, setUserCustomRisks] = useState<UserCustomRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [customRiskName, setCustomRiskName] = useState('')
  const [customRiskCategory, setCustomRiskCategory] = useState('')
  const [customRiskDescription, setCustomRiskDescription] = useState('')

  useEffect(() => {
    fetchRisks()
    fetchUserCustomRisks()
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

  const fetchUserCustomRisks = async () => {
    const { data } = await supabase
      .from('user_custom_risks')
      .select('*')
      .order('category, name')
    setUserCustomRisks(data || [])
  }

  const createCustomRisk = async () => {
    if (!customRiskName.trim() || !customRiskCategory.trim()) {
      alert('Nome e categoria sono obbligatori')
      return
    }

    const { data, error } = await supabase
      .from('user_custom_risks')
      .insert({
        user_id: user?.id,
        name: customRiskName.trim(),
        category: customRiskCategory.trim(),
        description: customRiskDescription.trim() || null
      })
      .select()
      .single()

    if (!error && data) {
      setUserCustomRisks([...userCustomRisks, data])
      setCustomRiskName('')
      setCustomRiskCategory('')
      setCustomRiskDescription('')
      setShowCreateModal(false)
    }
  }

  const deleteCustomRisk = async (riskId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo rischio personalizzato?')) return

    const { error } = await supabase
      .from('user_custom_risks')
      .delete()
      .eq('id', riskId)

    if (!error) {
      setUserCustomRisks(userCustomRisks.filter(r => r.id !== riskId))
    }
  }

  // Tutte le categorie (standard + personalizzate)
  const allCategories = [...new Set([
    ...risks.map(r => r.category),
    ...userCustomRisks.map(r => r.category)
  ])].sort()

  const filteredRisks = risks.filter(risk => {
    const matchesSearch = !searchTerm || 
      risk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || risk.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredUserRisks = userCustomRisks.filter(risk => {
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

  const groupedUserRisks = filteredUserRisks.reduce((acc, risk) => {
    if (!acc[risk.category]) {
      acc[risk.category] = []
    }
    acc[risk.category].push(risk)
    return acc
  }, {} as Record<string, UserCustomRisk[]>)

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
    return colors[category] || 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Catalogo Rischi</h1>
          <p className="text-gray-500 mt-1">
            {risks.length} rischi standard + {userCustomRisks.length} personalizzati
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-medium transition"
        >
          <Plus className="w-5 h-5" />
          Nuovo Rischio
        </button>
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
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          {filteredRisks.length + filteredUserRisks.length} rischi trovati
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
        {allCategories.map(cat => {
          const standardCount = risks.filter(r => r.category === cat).length
          const customCount = userCustomRisks.filter(r => r.category === cat).length
          const totalCount = standardCount + customCount
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
              <p className="text-gray-500 text-xs mt-1">
                {totalCount} rischi
                {customCount > 0 && <span className="text-emerald-600"> ({customCount} tuoi)</span>}
              </p>
            </button>
          )
        })}
      </div>

      {/* Risks List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          Caricamento...
        </div>
      ) : (filteredRisks.length === 0 && filteredUserRisks.length === 0) ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nessun rischio trovato</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Rischi Personalizzati */}
          {Object.keys(groupedUserRisks).length > 0 && (
            <div className="bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-emerald-200 bg-emerald-100">
                <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  I Miei Rischi Personalizzati ({filteredUserRisks.length})
                </h3>
              </div>
              {Object.entries(groupedUserRisks).map(([category, categoryRisks]) => (
                <div key={category} className="border-b border-emerald-200 last:border-b-0">
                  <div className="px-4 py-2 bg-emerald-50/50">
                    <span className="text-sm font-medium text-emerald-700">{category}</span>
                  </div>
                  <div className="divide-y divide-emerald-100">
                    {categoryRisks.map((risk, index) => (
                      <div key={risk.id} className="px-4 py-3 hover:bg-emerald-50 flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-emerald-400 text-sm font-mono w-8">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{risk.name}</p>
                            {risk.description && (
                              <p className="text-sm text-gray-500 mt-1">{risk.description}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteCustomRisk(risk.id)}
                          className="text-red-400 hover:text-red-600 p-1 ml-2"
                          title="Elimina rischio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rischi Standard */}
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

      {/* Modal Crea Rischio */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Nuovo Rischio Personalizzato</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCustomRiskName('')
                  setCustomRiskCategory('')
                  setCustomRiskDescription('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Rischio *
                </label>
                <input
                  type="text"
                  value={customRiskName}
                  onChange={(e) => setCustomRiskName(e.target.value)}
                  placeholder="Es: Errore di trascrizione dose"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <input
                  type="text"
                  value={customRiskCategory}
                  onChange={(e) => setCustomRiskCategory(e.target.value)}
                  placeholder="Es: UFA - Prescrizione"
                  list="categories-list-modal"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
                <datalist id="categories-list-modal">
                  {allCategories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-400 mt-1">
                  Scegli una categoria esistente o creane una nuova
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione (opzionale)
                </label>
                <textarea
                  value={customRiskDescription}
                  onChange={(e) => setCustomRiskDescription(e.target.value)}
                  placeholder="Descrivi il rischio in dettaglio..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCustomRiskName('')
                    setCustomRiskCategory('')
                    setCustomRiskDescription('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annulla
                </button>
                <button
                  onClick={createCustomRisk}
                  disabled={!customRiskName.trim() || !customRiskCategory.trim()}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crea Rischio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}