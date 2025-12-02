import { useState, useEffect} from 'react'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { exportToPDF, exportToExcel } from '../services/exportService'
import RiskMatrix from '../components/RiskMatrix'
import ParetoChart from '../components/ParetoChart'
import ParetoAnalysis from '../components/ParetoAnalysis'
import type { RiskAssessment, RiskItem, RiskCatalogBase, ActionPlan, UserCustomRisk } from '../types'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  AlertTriangle,
  X,
  FileDown,
  Filter,
  RotateCcw
} from 'lucide-react'
import { SEVERITY_SCALE, PROBABILITY_SCALE, DETECTABILITY_SCALE } from '../types'

export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null)
  const [riskItems, setRiskItems] = useState<RiskItem[]>([])
  const [catalogRisks, setCatalogRisks] = useState<RiskCatalogBase[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRisk, setShowAddRisk] = useState(false)
  const [selectedArea, setSelectedArea] = useState<string>('')
const [selectedSubArea, setSelectedSubArea] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)
  const [actions, setActions] = useState<ActionPlan[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('')
const [filterRiskClass, setFilterRiskClass] = useState<string>('')
const [filterRpnMin, setFilterRpnMin] = useState<string>('')
const [filterRpnMax, setFilterRpnMax] = useState<string>('')
const [filterHasActions, setFilterHasActions] = useState<string>('')
const [showFilters, setShowFilters] = useState(false)
const [userCustomRisks, setUserCustomRisks] = useState<UserCustomRisk[]>([])
const [showCreateCustom, setShowCreateCustom] = useState(false)
const [customRiskName, setCustomRiskName] = useState('')
const [customRiskArea, setCustomRiskArea] = useState('')
const [customRiskSubArea, setCustomRiskSubArea] = useState('')
const [customRiskDescription, setCustomRiskDescription] = useState('')
const [saveToPersonalCatalog, setSaveToPersonalCatalog] = useState(true)


useEffect(() => {
  if (id) {
    fetchAssessment()
    fetchRiskItems()
    fetchCatalogRisks()
    fetchActions()
    fetchUserCustomRisks()
  }
}, [id])

  const fetchAssessment = async () => {
    const { data, error } = await supabase
      .from('risk_assessments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Errore:', error)
      navigate('/dashboard')
    } else {
      setAssessment(data)
    }
    setLoading(false)
  }

  const fetchRiskItems = async () => {
    const { data } = await supabase
      .from('risk_items')
      .select(`
        *,
        risk_catalog_base (*)
      `)
      .eq('assessment_id', id)
      .order('created_at')

    setRiskItems(data || [])
  }

  const fetchCatalogRisks = async () => {
    const { data } = await supabase
      .from('risk_catalog_base')
      .select('*')
      .order('category, name')

    setCatalogRisks(data || [])
  }

  const fetchActions = async () => {
    const { data } = await supabase
      .from('action_plans')
      .select('*')
    setActions(data || [])
  }
  const fetchUserCustomRisks = async () => {
  const { data } = await supabase
    .from('user_custom_risks')
    .select('*')
    .order('name')
  setUserCustomRisks(data || [])
}

  // Funzione per parsare la categoria in Area e Sotto-area
const parseCategory = (category: string): { area: string; subArea: string | null } => {
  if (category.includes(' - ')) {
    const [area, subArea] = category.split(' - ')
    return { area: area.trim(), subArea: subArea.trim() }
  }
  return { area: category, subArea: null }
}

// Estrai tutte le aree e sotto-aree
const allCategories = [...new Set([
  ...catalogRisks.map(r => r.category),
  ...userCustomRisks.map(r => r.category)
])]

const areas = [...new Set(allCategories.map(c => parseCategory(c).area))].sort()

const subAreasForSelectedArea: string[] = selectedArea
  ? [...new Set(
      allCategories
        .filter(c => parseCategory(c).area === selectedArea)
        .map(c => parseCategory(c).subArea)
        .filter((s): s is string => s !== null)
    )].sort()
  : []
// Categorie dei rischi nell'assessment
const riskCategories = [...new Set(riskItems.map(r => r.risk_catalog_base?.category).filter(Boolean))]

// Filtra i rischi nella tabella
const filteredRiskItems = riskItems.filter(item => {
  // Filtro categoria
  if (filterCategory && item.risk_catalog_base?.category !== filterCategory) return false
  
  // Filtro classe rischio
  if (filterRiskClass && item.risk_class !== filterRiskClass) return false
  
  // Filtro RPN min
  if (filterRpnMin && (item.rpn || 0) < parseInt(filterRpnMin)) return false
  
  // Filtro RPN max
  if (filterRpnMax && (item.rpn || 0) > parseInt(filterRpnMax)) return false
  
  // Filtro azioni
  if (filterHasActions === 'with' && !actions.some(a => a.risk_item_id === item.id)) return false
  if (filterHasActions === 'without' && actions.some(a => a.risk_item_id === item.id)) return false
  
  return true
})

// Reset filtri
const resetFilters = () => {
  setFilterCategory('')
  setFilterRiskClass('')
  setFilterRpnMin('')
  setFilterRpnMax('')
  setFilterHasActions('')
}

const hasActiveFilters = filterCategory || filterRiskClass || filterRpnMin || filterRpnMax || filterHasActions

const filteredRisks = catalogRisks.filter(risk => {
  const { area, subArea } = parseCategory(risk.category)
  const matchesArea = !selectedArea || area === selectedArea
  const matchesSubArea = !selectedSubArea || subArea === selectedSubArea
  const matchesSearch = !searchTerm || 
    risk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    risk.description?.toLowerCase().includes(searchTerm.toLowerCase())
  return matchesArea && matchesSubArea && matchesSearch
})

const filteredUserRisks = userCustomRisks.filter(risk => {
  const { area, subArea } = parseCategory(risk.category)
  const matchesArea = !selectedArea || area === selectedArea
  const matchesSubArea = !selectedSubArea || subArea === selectedSubArea
  const matchesSearch = !searchTerm || 
    risk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    risk.description?.toLowerCase().includes(searchTerm.toLowerCase())
  return matchesArea && matchesSubArea && matchesSearch
})

  const addRiskFromCatalog = async (catalogRisk: RiskCatalogBase) => {
    const isDuplicate = riskItems.some(
      item => item.risk_catalog_base_id === catalogRisk.id
    )

    if (isDuplicate) {
      alert('⚠️ Questo rischio è già presente nell\'assessment!')
      return
    }

    const { data, error } = await supabase
      .from('risk_items')
      .insert({
        assessment_id: id,
        risk_catalog_base_id: catalogRisk.id,
        severity: null,
        probability: null,
        detectability: null
      })
      .select(`
        *,
        risk_catalog_base (*)
      `)
      .single()

    if (!error && data) {
      setRiskItems([...riskItems, data])
      setShowAddRisk(false)
    }
  }

  const addCustomRisk = async () => {
if (!customRiskName.trim() || !customRiskArea.trim()) {
  alert('Nome e Area sono obbligatori')
  return
}

  
  // Se l'utente vuole salvare nel catalogo personale
// Costruisci la categoria dal formato Area - SubArea
const fullCategory = customRiskSubArea.trim() 
  ? `${customRiskArea.trim()} - ${customRiskSubArea.trim()}`
  : customRiskArea.trim()

if (saveToPersonalCatalog && user) {
  const { data: customRisk, error: customError } = await supabase
    .from('user_custom_risks')
    .insert({
      user_id: user.id,
      name: customRiskName.trim(),
      category: fullCategory,
      description: customRiskDescription.trim() || null
    })
    .select()
    .single()

    if (customError) {
      console.error('Errore salvataggio rischio custom:', customError)
    } else {
   
      setUserCustomRisks([...userCustomRisks, customRisk])
    }
  }

  // Aggiungi il rischio all'assessment
  const { data, error } = await supabase
    .from('risk_items')
    .insert({
      assessment_id: id,
      risk_catalog_base_id: null,
      custom_risk_name: customRiskName.trim(),
      severity: null,
      probability: null,
      detectability: null
    })
    .select(`
      *,
      risk_catalog_base (*)
    `)
    .single()

  if (!error && data) {
    setRiskItems([...riskItems, data])
// Reset form
setCustomRiskName('')
setCustomRiskArea('')
setCustomRiskSubArea('')
setCustomRiskDescription('')
    setSaveToPersonalCatalog(true)
    setShowCreateCustom(false)
    setShowAddRisk(false)
  }
}

const addRiskFromUserCatalog = async (customRisk: UserCustomRisk) => {
  // Controlla se già presente
  const isDuplicate = riskItems.some(
    item => item.custom_risk_name === customRisk.name
  )

  if (isDuplicate) {
    alert('⚠️ Questo rischio è già presente nell\'assessment!')
    return
  }

  const { data, error } = await supabase
    .from('risk_items')
    .insert({
      assessment_id: id,
      risk_catalog_base_id: null,
      custom_risk_name: customRisk.name,
      severity: null,
      probability: null,
      detectability: null
    })
    .select(`
      *,
      risk_catalog_base (*)
    `)
    .single()

  if (!error && data) {
    setRiskItems([...riskItems, data])
    setShowAddRisk(false)
  }
}
  

  const updateRiskItem = async (riskItemId: string, field: string, value: number | null) => {
    setSaving(true)
    
    const { error } = await supabase
      .from('risk_items')
      .update({ [field]: value })
      .eq('id', riskItemId)

    if (!error) {
      setRiskItems(riskItems.map(item => 
        item.id === riskItemId ? { ...item, [field]: value } : item
      ))
      fetchRiskItems()
    }
    
    setSaving(false)
  }

  const deleteRiskItem = async (riskItemId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo rischio?')) return

    const { error } = await supabase
      .from('risk_items')
      .delete()
      .eq('id', riskItemId)

    if (!error) {
      setRiskItems(riskItems.filter(item => item.id !== riskItemId))
    }
  }

  const getRiskClassName = (riskClass: string | null) => {
    switch (riskClass) {
      case 'Alta':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'Media':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'Bassa':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200'
    }
  }

  const updateAssessmentStatus = async (status: string) => {
    const { error } = await supabase
      .from('risk_assessments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error && assessment) {
      setAssessment({ ...assessment, status: status as any })
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!assessment) return null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla Dashboard
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{assessment.title}</h1>
            {assessment.description && (
              <p className="text-gray-500 mt-1">{assessment.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={assessment.status}
              onChange={(e) => updateAssessmentStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            >
              <option value="draft">Bozza</option>
              <option value="in_progress">In Corso</option>
              <option value="completed">Completato</option>
            </select>
            
            <button
              onClick={() => setShowAddRisk(true)}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <Plus className="w-5 h-5" />
              Aggiungi Rischio
            </button>

<button
  onClick={() => exportToPDF({ assessment, riskItems, actions, paretoThreshold: 80 })}
  disabled={riskItems.length === 0}
  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
>
  <FileDown className="w-5 h-5" />
  PDF
</button>

<button
  onClick={() => exportToExcel({ assessment, riskItems, actions })}
  disabled={riskItems.length === 0}
  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
>
  <FileDown className="w-5 h-5" />
  Excel
</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Rischi Totali</p>
          <p className="text-2xl font-bold text-gray-800">{riskItems.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Rischio Alto</p>
          <p className="text-2xl font-bold text-red-600">
            {riskItems.filter(r => r.risk_class === 'Alta').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Rischio Medio</p>
          <p className="text-2xl font-bold text-yellow-600">
            {riskItems.filter(r => r.risk_class === 'Media').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Rischio Basso</p>
          <p className="text-2xl font-bold text-green-600">
            {riskItems.filter(r => r.risk_class === 'Bassa').length}
          </p>
        </div>
      </div>

      {/* Risk Items Table */}
<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
  <div className="p-4 border-b border-gray-100">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800">
        Rischi Identificati
        {hasActiveFilters && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({filteredRiskItems.length} di {riskItems.length})
          </span>
        )}
      </h2>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
          showFilters || hasActiveFilters
            ? 'bg-sky-100 text-sky-700'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filtri
        {hasActiveFilters && (
          <span className="bg-sky-600 text-white text-xs px-1.5 py-0.5 rounded-full">
            !
          </span>
        )}
      </button>
    </div>

    {/* Pannello Filtri */}
    {showFilters && (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            >
              <option value="">Tutte</option>
              {riskCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Classe Rischio */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Classe</label>
            <select
              value={filterRiskClass}
              onChange={(e) => setFilterRiskClass(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            >
              <option value="">Tutte</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Bassa">Bassa</option>
            </select>
          </div>

          {/* RPN Min */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">RPN Min</label>
            <input
              type="number"
              value={filterRpnMin}
              onChange={(e) => setFilterRpnMin(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            />
          </div>

          {/* RPN Max */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">RPN Max</label>
            <input
              type="number"
              value={filterRpnMax}
              onChange={(e) => setFilterRpnMax(e.target.value)}
              placeholder="125"
              min="0"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Azioni */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Azioni</label>
            <select
              value={filterHasActions}
              onChange={(e) => setFilterHasActions(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            >
              <option value="">Tutte</option>
              <option value="with">Con azioni</option>
              <option value="without">Senza azioni</option>
            </select>
          </div>

          {/* Reset */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="w-full px-2 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
      </div>
    )}
  </div>

        {filteredRiskItems.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nessun rischio ancora aggiunto</p>
            <button
              onClick={() => setShowAddRisk(true)}
              className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Aggiungi il primo rischio
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Rischio</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-24">S</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-24">P</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-24">D</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-20">RPN</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-28">Classe</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRiskItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.risk_catalog_base?.name || item.custom_risk_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.risk_catalog_base?.category}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.severity || ''}
                        onChange={(e) => updateRiskItem(item.id, 'severity', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                      >
                        <option value="">-</option>
                        {SEVERITY_SCALE.map(s => (
                          <option key={s.value} value={s.value}>{s.value}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.probability || ''}
                        onChange={(e) => updateRiskItem(item.id, 'probability', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                      >
                        <option value="">-</option>
                        {PROBABILITY_SCALE.map(p => (
                          <option key={p.value} value={p.value}>{p.value}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.detectability || ''}
                        onChange={(e) => updateRiskItem(item.id, 'detectability', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                      >
                        <option value="">-</option>
                        {DETECTABILITY_SCALE.map(d => (
                          <option key={d.value} value={d.value}>{d.value}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-gray-800">
                        {item.rpn || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskClassName(item.risk_class)}`}>
                        {item.risk_class || 'N/D'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteRiskItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

{/* Grafici */}
{riskItems.length > 0 && (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    <RiskMatrix riskItems={riskItems} />
    <ParetoChart riskItems={riskItems} />
  </div>
)}

      {/* Analisi Pareto Avanzata */}
      {riskItems.length > 0 && (
        <div className="mt-6">
          <ParetoAnalysis riskItems={riskItems} actions={actions} />
        </div>
      )}

{/* Modal Aggiungi Rischio */}
{showAddRisk && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          {showCreateCustom ? 'Crea Rischio Personalizzato' : 'Aggiungi Rischio'}
        </h3>
        <button
          onClick={() => {
            setShowAddRisk(false)
            setShowCreateCustom(false)
            setCustomRiskName('')
            setCustomRiskArea('')
            setCustomRiskSubArea('')
            setCustomRiskDescription('')
            setSelectedArea('')
            setSelectedSubArea('')
            setSearchTerm('')
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {showCreateCustom ? (
        /* Form Creazione Rischio Personalizzato */
        <div className="p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Rischio *
            </label>
            <input
              type="text"
              value={customRiskName}
              onChange={(e) => setCustomRiskName(e.target.value)}
              placeholder="Es: Errore di trascrizione dose"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area *
              </label>
              <input
                type="text"
                value={customRiskArea}
                onChange={(e) => setCustomRiskArea(e.target.value)}
                placeholder="Es: UFA"
                list="areas-list-create"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
              />
              <datalist id="areas-list-create">
                {areas.map(area => (
                  <option key={area} value={area} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sotto-area (opzionale)
              </label>
              <input
                type="text"
                value={customRiskSubArea}
                onChange={(e) => setCustomRiskSubArea(e.target.value)}
                placeholder="Es: Prescrizione"
                list="subareas-list-create"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
              />
              <datalist id="subareas-list-create">
                {customRiskArea && [...new Set(
                  allCategories
                    .filter(c => parseCategory(c).area === customRiskArea)
                    .map(c => parseCategory(c).subArea)
                    .filter(Boolean)
                )].map(subArea => (
                  <option key={subArea} value={subArea!} />
                ))}
              </datalist>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            La categoria finale sarà: <strong>{customRiskSubArea.trim() ? `${customRiskArea.trim()} - ${customRiskSubArea.trim()}` : customRiskArea.trim() || '...'}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione (opzionale)
            </label>
            <textarea
              value={customRiskDescription}
              onChange={(e) => setCustomRiskDescription(e.target.value)}
              placeholder="Descrivi il rischio in dettaglio..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg">
            <input
              type="checkbox"
              id="saveToPersonal"
              checked={saveToPersonalCatalog}
              onChange={(e) => setSaveToPersonalCatalog(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
            />
            <label htmlFor="saveToPersonal" className="text-sm text-gray-700">
              Salva nel mio catalogo personale per riutilizzarlo in altri assessment
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowCreateCustom(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Indietro
            </button>
            <button
              onClick={addCustomRisk}
              disabled={!customRiskName.trim() || !customRiskArea.trim()}
              className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aggiungi Rischio
            </button>
          </div>
        </div>
      ) : (
        /* Lista Rischi dal Catalogo */
        <>
          <div className="p-4 border-b border-gray-100 space-y-3">
            {/* Ricerca */}
            <input
              type="text"
              placeholder="Cerca rischio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            />
            
            {/* Filtri gerarchici */}
            <div className="flex gap-2">
              <select
                value={selectedArea}
                onChange={(e) => {
                  setSelectedArea(e.target.value)
                  setSelectedSubArea('') // Reset sotto-area quando cambia area
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
              >
                <option value="">Tutte le aree</option>
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>

              <select
                value={selectedSubArea}
                onChange={(e) => setSelectedSubArea(e.target.value)}
                disabled={!selectedArea || subAreasForSelectedArea.length === 0}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Tutte le sotto-aree</option>
                {subAreasForSelectedArea.map(subArea => (
                  <option key={subArea} value={subArea!}>{subArea}</option>
                ))}
              </select>

              <button
                onClick={() => setShowCreateCustom(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Crea Nuovo
              </button>
            </div>

            {/* Reset filtri */}
            {(selectedArea || selectedSubArea || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedArea('')
                  setSelectedSubArea('')
                  setSearchTerm('')
                }}
                className="text-sm text-sky-600 hover:text-sky-700"
              >
                Cancella filtri
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Rischi Personalizzati dell'utente */}
            {filteredUserRisks.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  I Miei Rischi Personalizzati ({filteredUserRisks.length})
                </h4>
                <div className="space-y-2">
                  {filteredUserRisks.map(risk => {
                    const isAlreadyAdded = riskItems.some(item => item.custom_risk_name === risk.name)
                    const { area, subArea } = parseCategory(risk.category)
                    
                    return (
                      <button
                        key={risk.id}
                        onClick={() => !isAlreadyAdded && addRiskFromUserCatalog(risk)}
                        disabled={isAlreadyAdded}
                        className={`w-full text-left p-4 border rounded-lg transition ${
                          isAlreadyAdded 
                            ? 'border-emerald-200 bg-emerald-50 cursor-not-allowed opacity-60' 
                            : 'border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className={`font-medium ${isAlreadyAdded ? 'text-gray-500' : 'text-gray-800'}`}>
                              {risk.name}
                            </p>
                            <p className="text-sm text-emerald-600">
                              {area}{subArea && ` › ${subArea}`}
                            </p>
                            {risk.description && (
                              <p className="text-sm text-gray-400 mt-1">{risk.description}</p>
                            )}
                          </div>
                          {isAlreadyAdded && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              ✓ Aggiunto
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Rischi dal Catalogo Base */}
            <div>
              <h4 className="text-sm font-semibold text-sky-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
                Catalogo Standard ({filteredRisks.length})
              </h4>
              <div className="space-y-2">
                {filteredRisks.map(risk => {
                  const isAlreadyAdded = riskItems.some(item => item.risk_catalog_base_id === risk.id)
                  const { area, subArea } = parseCategory(risk.category)
                  
                  return (
                    <button
                      key={risk.id}
                      onClick={() => !isAlreadyAdded && addRiskFromCatalog(risk)}
                      disabled={isAlreadyAdded}
                      className={`w-full text-left p-4 border rounded-lg transition ${
                        isAlreadyAdded 
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' 
                          : 'border-gray-200 hover:border-sky-500 hover:bg-sky-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className={`font-medium ${isAlreadyAdded ? 'text-gray-500' : 'text-gray-800'}`}>
                            {risk.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {area}{subArea && ` › ${subArea}`}
                          </p>
                          {risk.description && (
                            <p className="text-sm text-gray-400 mt-1">{risk.description}</p>
                          )}
                        </div>
                        {isAlreadyAdded && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            ✓ Aggiunto
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}

                {filteredRisks.length === 0 && filteredUserRisks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nessun rischio trovato con i filtri selezionati
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
)}

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-sky-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Salvataggio...
        </div>
      )}
    </div>
  )
}