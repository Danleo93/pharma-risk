import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { exportToPDF, exportToExcel } from '../services/exportService'
import RiskMatrix from '../components/RiskMatrix'
import ParetoChart from '../components/ParetoChart'
import type { RiskAssessment, RiskItem, RiskCatalogBase } from '../types'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  AlertTriangle,
  X,
  FileDown
} from 'lucide-react'
import { SEVERITY_SCALE, PROBABILITY_SCALE, DETECTABILITY_SCALE } from '../types'

export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null)
  const [riskItems, setRiskItems] = useState<RiskItem[]>([])
  const [catalogRisks, setCatalogRisks] = useState<RiskCatalogBase[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRisk, setShowAddRisk] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) {
      fetchAssessment()
      fetchRiskItems()
      fetchCatalogRisks()
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

  const categories = [...new Set(catalogRisks.map(r => r.category))]

  const filteredRisks = catalogRisks.filter(risk => {
    const matchesCategory = !selectedCategory || risk.category === selectedCategory
    const matchesSearch = !searchTerm || 
      risk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const addRiskFromCatalog = async (catalogRisk: RiskCatalogBase) => {
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
              onClick={() => exportToPDF({ assessment, riskItems })}
              disabled={riskItems.length === 0}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-5 h-5" />
              PDF
            </button>

            <button
              onClick={() => exportToExcel({ assessment, riskItems })}
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
          <h2 className="text-lg font-semibold text-gray-800">Rischi Identificati</h2>
        </div>

        {riskItems.length === 0 ? (
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
                {riskItems.map((item) => (
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

      {/* Modal Aggiungi Rischio */}
      {showAddRisk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Aggiungi Rischio dal Catalogo</h3>
              <button
                onClick={() => setShowAddRisk(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 space-y-3">
              <input
                type="text"
                placeholder="Cerca rischio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
              >
                <option value="">Tutte le categorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredRisks.map(risk => (
                  <button
                    key={risk.id}
                    onClick={() => addRiskFromCatalog(risk)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-sky-500 hover:bg-sky-50 transition"
                  >
                    <p className="font-medium text-gray-800">{risk.name}</p>
                    <p className="text-sm text-gray-500">{risk.category}</p>
                    {risk.description && (
                      <p className="text-sm text-gray-400 mt-1">{risk.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
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