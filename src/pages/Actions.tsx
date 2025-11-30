import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ActionPlan, RiskItem } from '../types'
import { CheckCircle, Clock, AlertCircle, Plus, X, Calendar, User } from 'lucide-react'

interface ActionWithRisk extends ActionPlan {
  risk_item?: RiskItem & {
    risk_catalog_base?: { name: string; category: string }
    risk_assessment?: { title: string }
  }
}

export default function Actions() {
  const [actions, setActions] = useState<ActionWithRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [riskItems, setRiskItems] = useState<any[]>([])

  // Form per nuova azione
  const [selectedRiskItem, setSelectedRiskItem] = useState('')
  const [description, setDescription] = useState('')
  const [responsible, setResponsible] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchActions()
    fetchRiskItems()
  }, [])

  const fetchActions = async () => {
    const { data, error } = await supabase
      .from('action_plans')
      .select(`
        *,
        risk_item:risk_items (
          *,
          risk_catalog_base (*),
          risk_assessment:risk_assessments (title)
        )
      `)
      .order('created_at', { ascending: false })

    if (!error) {
      setActions(data || [])
    }
    setLoading(false)
  }

  const fetchRiskItems = async () => {
    const { data } = await supabase
      .from('risk_items')
      .select(`
        *,
        risk_catalog_base (*),
        risk_assessment:risk_assessments (title)
      `)
      .order('created_at', { ascending: false })

    setRiskItems(data || [])
  }

  const addAction = async () => {
    if (!selectedRiskItem || !description.trim()) return

    setSaving(true)
    const { data, error } = await supabase
      .from('action_plans')
      .insert({
        risk_item_id: selectedRiskItem,
        description: description.trim(),
        responsible: responsible.trim() || null,
        due_date: dueDate || null,
        status: 'planned'
      })
      .select(`
        *,
        risk_item:risk_items (
          *,
          risk_catalog_base (*),
          risk_assessment:risk_assessments (title)
        )
      `)
      .single()

    if (!error && data) {
      setActions([data, ...actions])
      setShowAddModal(false)
      resetForm()
    }
    setSaving(false)
  }

  const updateActionStatus = async (actionId: string, newStatus: string) => {
    const updates: any = { status: newStatus }
    if (newStatus === 'completed') {
      updates.completion_date = new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase
      .from('action_plans')
      .update(updates)
      .eq('id', actionId)

    if (!error) {
      setActions(actions.map(a => 
        a.id === actionId 
          ? { ...a, status: newStatus as any, completion_date: updates.completion_date || a.completion_date }
          : a
      ))
    }
  }

  const deleteAction = async (actionId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa azione?')) return

    const { error } = await supabase
      .from('action_plans')
      .delete()
      .eq('id', actionId)

    if (!error) {
      setActions(actions.filter(a => a.id !== actionId))
    }
  }

  const resetForm = () => {
    setSelectedRiskItem('')
    setDescription('')
    setResponsible('')
    setDueDate('')
  }

  const filteredActions = actions.filter(a => {
    if (filter === 'all') return true
    return a.status === filter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completata'
      case 'in_progress': return 'In Corso'
      default: return 'Pianificata'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'in_progress': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  const stats = {
    total: actions.length,
    planned: actions.filter(a => a.status === 'planned').length,
    inProgress: actions.filter(a => a.status === 'in_progress').length,
    completed: actions.filter(a => a.status === 'completed').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Azioni Correttive</h1>
          <p className="text-gray-500 mt-1">Gestisci le azioni per mitigare i rischi</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-lg font-medium transition"
        >
          <Plus className="w-5 h-5" />
          Nuova Azione
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Totale</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Pianificate</p>
          <p className="text-2xl font-bold text-blue-600">{stats.planned}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">In Corso</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Completate</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'planned', 'in_progress', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === f 
                ? 'bg-sky-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f === 'all' ? 'Tutte' : getStatusLabel(f)}
          </button>
        ))}
      </div>

      {/* Actions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Caricamento...</div>
        ) : filteredActions.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nessuna azione trovata</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredActions.map(action => (
              <div key={action.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  {getStatusIcon(action.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{action.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Rischio: {action.risk_item?.risk_catalog_base?.name || 'N/D'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      {action.responsible && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {action.responsible}
                        </span>
                      )}
                      {action.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Scadenza: {new Date(action.due_date).toLocaleDateString('it-IT')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={action.status}
                      onChange={(e) => updateActionStatus(action.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${getStatusColor(action.status)}`}
                    >
                      <option value="planned">Pianificata</option>
                      <option value="in_progress">In Corso</option>
                      <option value="completed">Completata</option>
                    </select>
                    <button
                      onClick={() => deleteAction(action.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nuova Azione */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Nuova Azione Correttiva</h3>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rischio Associato *
                </label>
                <select
                  value={selectedRiskItem}
                  onChange={(e) => setSelectedRiskItem(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleziona un rischio...</option>
                  {riskItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.risk_catalog_base?.name || item.custom_risk_name} 
                      ({item.risk_assessment?.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione Azione *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none resize-none"
                  placeholder="Descrivi l'azione correttiva..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsabile
                  </label>
                  <input
                    type="text"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                    placeholder="Nome responsabile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Scadenza
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Annulla
              </button>
              <button
                onClick={addAction}
                disabled={!selectedRiskItem || !description.trim() || saving}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : 'Aggiungi Azione'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}