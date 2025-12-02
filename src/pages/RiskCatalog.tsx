import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { RiskCatalogBase, UserCustomRisk } from '../types'
import { Search, AlertTriangle, Plus, Trash2, X, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react'

// Funzione per parsare la categoria in Area e Sotto-area
const parseCategory = (category: string): { area: string; subArea: string | null } => {
  if (category.includes(' - ')) {
    const [area, subArea] = category.split(' - ')
    return { area: area.trim(), subArea: subArea.trim() }
  }
  return { area: category, subArea: null }
}

export default function RiskCatalog() {
  const { user } = useAuth()
  const [risks, setRisks] = useState<RiskCatalogBase[]>([])
  const [userCustomRisks, setUserCustomRisks] = useState<UserCustomRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'standard' | 'personal'>('all')
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set())
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

  const toggleArea = (area: string) => {
    const newExpanded = new Set(expandedAreas)
    if (newExpanded.has(area)) {
      newExpanded.delete(area)
    } else {
      newExpanded.add(area)
    }
    setExpandedAreas(newExpanded)
  }

  const expandAll = () => {
    const allAreas = new Set(allRisks.map(r => parseCategory(r.category).area))
    setExpandedAreas(allAreas)
  }

  const collapseAll = () => {
    setExpandedAreas(new Set())
  }

  // Combina tutti i rischi (standard + personalizzati)
  const allRisks = [
    ...risks.map(r => ({ ...r, isCustom: false })),
    ...userCustomRisks.map(r => ({ ...r, isCustom: true }))
  ]

// Filtra per ricerca e tipo catalogo
const filteredRisks = allRisks.filter(risk => {
  const matchesSearch = !searchTerm || 
    risk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    risk.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    risk.category.toLowerCase().includes(searchTerm.toLowerCase())
  const { area } = parseCategory(risk.category)
  const matchesArea = !selectedArea || area === selectedArea
  const matchesCatalog = catalogFilter === 'all' || 
    (catalogFilter === 'standard' && !risk.isCustom) ||
    (catalogFilter === 'personal' && risk.isCustom)
  return matchesSearch && matchesArea && matchesCatalog
})
  // Raggruppa per Area → Sotto-area → Rischi
  const groupedByArea: Record<string, Record<string, typeof filteredRisks>> = {}
  
  filteredRisks.forEach(risk => {
    const { area, subArea } = parseCategory(risk.category)
    const subAreaKey = subArea || '_root' // _root per rischi senza sotto-area
    
    if (!groupedByArea[area]) {
      groupedByArea[area] = {}
    }
    if (!groupedByArea[area][subAreaKey]) {
      groupedByArea[area][subAreaKey] = []
    }
    groupedByArea[area][subAreaKey].push(risk)
  })

  // Ordina le aree alfabeticamente
  const sortedAreas = Object.keys(groupedByArea).sort()

  // Estrai tutte le aree uniche per il filtro
  const allAreas = [...new Set(allRisks.map(r => parseCategory(r.category).area))].sort()

  // Tutte le categorie per il form di creazione
  const allCategories = [...new Set(allRisks.map(r => r.category))].sort()

  const getAreaColor = (area: string) => {
    const colors: Record<string, string> = {
      'UFA': 'bg-purple-500',
      'Magazzino': 'bg-amber-500',
      'Catena Freddo': 'bg-sky-500',
      'DPC': 'bg-indigo-500',
      'Alto Rischio': 'bg-red-500',
      'Nutrizione Parenterale': 'bg-green-500',
      'Galenica': 'bg-orange-500',
      'Dispensazione Reparto': 'bg-pink-500',
      'Sperimentazioni': 'bg-violet-500',
      'Sistema': 'bg-gray-500',
    }
    return colors[area] || 'bg-emerald-500'
  }

  const getAreaStats = (area: string) => {
    const areaRisks = allRisks.filter(r => parseCategory(r.category).area === area)
    const standard = areaRisks.filter(r => !r.isCustom).length
    const custom = areaRisks.filter(r => r.isCustom).length
    return { total: areaRisks.length, standard, custom }
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

<div className="sm:w-64">
  <select
    value={selectedArea}
    onChange={(e) => setSelectedArea(e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none appearance-none bg-white"
  >
    <option value="">Tutte le aree</option>
    {allAreas.map(area => (
      <option key={area} value={area}>{area}</option>
    ))}
  </select>
</div>

{/* Filtro tipo catalogo */}
<div className="flex rounded-lg border border-gray-300 overflow-hidden">
  <button
    onClick={() => setCatalogFilter('all')}
    className={`px-4 py-3 text-sm font-medium transition ${
      catalogFilter === 'all'
        ? 'bg-sky-600 text-white'
        : 'bg-white text-gray-600 hover:bg-gray-50'
    }`}
  >
    Tutti
  </button>
  <button
    onClick={() => setCatalogFilter('standard')}
    className={`px-4 py-3 text-sm font-medium border-l border-gray-300 transition ${
      catalogFilter === 'standard'
        ? 'bg-sky-600 text-white'
        : 'bg-white text-gray-600 hover:bg-gray-50'
    }`}
  >
    Standard
  </button>
  <button
    onClick={() => setCatalogFilter('personal')}
    className={`px-4 py-3 text-sm font-medium border-l border-gray-300 transition ${
      catalogFilter === 'personal'
        ? 'bg-emerald-600 text-white'
        : 'bg-white text-gray-600 hover:bg-gray-50'
    }`}
  >
    Personali
  </button>
</div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {filteredRisks.length} rischi trovati
{(searchTerm || selectedArea || catalogFilter !== 'all') && (
  <button
    onClick={() => { setSearchTerm(''); setSelectedArea(''); setCatalogFilter('all'); }}
    className="ml-2 text-sky-600 hover:text-sky-700"
  >
    Cancella filtri
  </button>
)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-sm text-sky-600 hover:text-sky-700"
            >
              Espandi tutto
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-sky-600 hover:text-sky-700"
            >
              Comprimi tutto
            </button>
          </div>
        </div>
      </div>

      {/* Area Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        {allAreas.map(area => {
          const stats = getAreaStats(area)
          const isSelected = selectedArea === area
          return (
            <button
              key={area}
              onClick={() => setSelectedArea(isSelected ? '' : area)}
              className={`p-3 rounded-lg border text-left transition ${
                isSelected
                  ? 'ring-2 ring-sky-500 bg-sky-50 border-sky-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-3 h-3 rounded-full ${getAreaColor(area)}`}></div>
                <p className="font-medium text-gray-800 text-sm truncate">{area}</p>
              </div>
              <p className="text-gray-500 text-xs">
                {stats.total} rischi
                {stats.custom > 0 && <span className="text-emerald-600"> ({stats.custom} tuoi)</span>}
              </p>
            </button>
          )
        })}
      </div>

      {/* Hierarchical Risk List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento...
        </div>
      ) : filteredRisks.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nessun rischio trovato</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAreas.map(area => {
            const isExpanded = expandedAreas.has(area)
            const subAreas = groupedByArea[area]
            const sortedSubAreas = Object.keys(subAreas).sort((a, b) => {
              if (a === '_root') return -1
              if (b === '_root') return 1
              return a.localeCompare(b)
            })
            const totalInArea = Object.values(subAreas).flat().length

            return (
              <div key={area} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Area Header */}
                <button
                  onClick={() => toggleArea(area)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <FolderOpen className={`w-5 h-5 text-${getAreaColor(area).replace('bg-', '').replace('-500', '-600')}`} style={{ color: getAreaColor(area).includes('purple') ? '#9333ea' : getAreaColor(area).includes('amber') ? '#d97706' : getAreaColor(area).includes('sky') ? '#0284c7' : getAreaColor(area).includes('red') ? '#dc2626' : getAreaColor(area).includes('green') ? '#16a34a' : '#6b7280' }} />
                    ) : (
                      <Folder className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getAreaColor(area)}`}></div>
                      <h3 className="font-semibold text-gray-800">{area}</h3>
                    </div>
                    <span className="text-sm text-gray-500">({totalInArea} rischi)</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {sortedSubAreas.map(subAreaKey => {
                      const risksInSubArea = subAreas[subAreaKey]
                      const subAreaName = subAreaKey === '_root' ? null : subAreaKey

                      return (
                        <div key={subAreaKey}>
                          {/* Sub-area Header */}
                          {subAreaName && (
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                              <div className="flex items-center gap-2 ml-8">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">{subAreaName}</span>
                                <span className="text-xs text-gray-400">({risksInSubArea.length})</span>
                              </div>
                            </div>
                          )}

                          {/* Risks */}
                          <div className="divide-y divide-gray-100">
                            {risksInSubArea.map((risk, index) => (
                              <div
                                key={risk.id}
                                className={`px-4 py-3 hover:bg-gray-50 ${risk.isCustom ? 'bg-emerald-50/30' : ''}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <span className={`text-sm font-mono w-8 ${risk.isCustom ? 'text-emerald-500' : 'text-gray-400'}`} style={{ marginLeft: subAreaName ? '2rem' : '0' }}>
                                      {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-800">{risk.name}</p>
                                        {risk.isCustom && (
                                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                            Personalizzato
                                          </span>
                                        )}
                                      </div>
                                      {risk.description && (
                                        <p className="text-sm text-gray-500 mt-1">{risk.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  {risk.isCustom && (
                                    <button
                                      onClick={() => deleteCustomRisk(risk.id)}
                                      className="text-red-400 hover:text-red-600 p-1 ml-2"
                                      title="Elimina rischio"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
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
                  Usa il formato "Area - Sotto-area" per la gerarchia (es. "UFA - Prescrizione")
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