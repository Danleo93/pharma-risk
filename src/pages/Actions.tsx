import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ActionPlan, RiskItem, RiskAssessment } from '../types'
import { CheckCircle, Clock, AlertCircle, Plus, X, Calendar, User, FileText, ChevronRight, Filter } from 'lucide-react'
import { getFMEAActionStatusColor, getFMEAActionStatusLabel, getFMEARiskClassColor } from '../lib/labels'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'

interface ActionWithRisk extends ActionPlan {
  risk_item?: RiskItem & {
    risk_catalog_base?: { name: string; category: string }
    risk_assessment?: { title: string; id: string }
  }
}

export default function Actions() {
  const [actions, setActions] = useState<ActionWithRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [filterAssessment, setFilterAssessment] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)
  
  // Lista assessment e rischi
  const [assessments, setAssessments] = useState<RiskAssessment[]>([])
  const [riskItems, setRiskItems] = useState<any[]>([])
  const [filteredRiskItems, setFilteredRiskItems] = useState<any[]>([])

  // Form per nuova azione - Step 1: Assessment, Step 2: Rischio, Step 3: Dettagli
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedAssessment, setSelectedAssessment] = useState('')
  const [selectedRiskItem, setSelectedRiskItem] = useState('')
  const [description, setDescription] = useState('')
  const [responsible, setResponsible] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchActions()
    fetchAssessments()
    fetchRiskItems()
  }, [])

  // Filtra i rischi quando cambia l'assessment selezionato
  useEffect(() => {
    if (selectedAssessment) {
      const filtered = riskItems.filter(r => r.assessment_id === selectedAssessment)
      setFilteredRiskItems(filtered)
    } else {
      setFilteredRiskItems([])
    }
    setSelectedRiskItem('')
  }, [selectedAssessment, riskItems])

  const fetchActions = async () => {
    const { data, error } = await supabase
      .from('action_plans')
      .select(`
        *,
        risk_item:risk_items (
          *,
          risk_catalog_base (*),
          risk_assessment:risk_assessments (id, title)
        )
      `)
      .order('created_at', { ascending: false })

    if (!error) {
      setActions(data || [])
    }
    setLoading(false)
  }

  const fetchAssessments = async () => {
    const { data } = await supabase
      .from('risk_assessments')
      .select('*')
      .order('created_at', { ascending: false })

    setAssessments(data || [])
  }

  const fetchRiskItems = async () => {
    const { data } = await supabase
      .from('risk_items')
      .select(`
        *,
        risk_catalog_base (*),
        risk_assessment:risk_assessments (id, title)
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
          risk_assessment:risk_assessments (id, title)
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
    setStep(1)
    setSelectedAssessment('')
    setSelectedRiskItem('')
    setDescription('')
    setResponsible('')
    setDueDate('')
  }

  const handleNextStep = () => {
    if (step === 1 && selectedAssessment) {
      setStep(2)
    } else if (step === 2 && selectedRiskItem) {
      setStep(3)
    }
  }

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1)
      setSelectedRiskItem('')
    } else if (step === 3) {
      setStep(2)
    }
  }

  // Filtra le azioni per stato e assessment
  const filteredActions = actions.filter(a => {
    // Filtro stato
    if (filter !== 'all' && a.status !== filter) return false
    // Filtro assessment
    if (filterAssessment && a.risk_item?.risk_assessment?.id !== filterAssessment) return false
    return true
  })

  // Raggruppa le azioni per assessment
  const groupedActions = filteredActions.reduce((groups, action) => {
    const assessmentTitle = action.risk_item?.risk_assessment?.title || 'Senza Assessment'
    if (!groups[assessmentTitle]) {
      groups[assessmentTitle] = []
    }
    groups[assessmentTitle].push(action)
    return groups
  }, {} as Record<string, ActionWithRisk[]>)

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

  const stats = {
    total: actions.length,
    planned: actions.filter(a => a.status === 'planned').length,
    inProgress: actions.filter(a => a.status === 'in_progress').length,
    completed: actions.filter(a => a.status === 'completed').length,
  }

  const getSelectedAssessmentTitle = () => {
    return assessments.find(a => a.id === selectedAssessment)?.title || ''
  }

  const getSelectedRiskName = () => {
    const risk = filteredRiskItems.find(r => r.id === selectedRiskItem)
    return risk?.risk_catalog_base?.name || risk?.custom_risk_name || ''
  }

  // Assessment che hanno azioni (per il filtro)
  const assessmentsWithActions = [...new Set(
    actions
      .map(a => a.risk_item?.risk_assessment?.id)
      .filter(Boolean)
  )]

  return (
    <div className="clinical-page">
      <PageHeader
        title="Azioni Correttive"
        description="Gestisci le azioni per mitigare i rischi."
        eyebrow="Analisi Proattiva"
        actions={(
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-5 py-3 font-medium text-white transition hover:bg-sky-800"
          >
            <Plus className="w-5 h-5" />
            Nuova Azione
          </button>
        )}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Totale" value={stats.total} icon={<CheckCircle className="w-6 h-6" />} tone="fmea" />
        <StatCard label="Pianificate" value={stats.planned} icon={<AlertCircle className="w-6 h-6" />} tone="clinical" />
        <StatCard label="In corso" value={stats.inProgress} icon={<Clock className="w-6 h-6" />} tone="warning" />
        <StatCard label="Completate" value={stats.completed} icon={<CheckCircle className="w-6 h-6" />} tone="success" />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
        {/* Filtro Stato */}
        <div className="flex flex-wrap gap-2">
          {['all', 'planned', 'in_progress', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f 
                  ? 'bg-sky-700 text-white' 
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-800'
              }`}
            >
              {f === 'all' ? 'Tutte' : getFMEAActionStatusLabel(f)}
            </button>
          ))}
        </div>

        {/* Filtro Assessment */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterAssessment}
            onChange={(e) => setFilterAssessment(e.target.value)}
            className="clinical-input px-4 py-2"
          >
            <option value="">Tutti gli Assessment</option>
            {assessments
              .filter(a => assessmentsWithActions.includes(a.id))
              .map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))
            }
          </select>
          {filterAssessment && (
            <button
              onClick={() => setFilterAssessment('')}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        </CardContent>
      </Card>

      {/* Actions List - Raggruppate per Assessment */}
      <div className="space-y-6">
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
            Caricamento...
            </CardContent>
          </Card>
        ) : filteredActions.length === 0 ? (
          <EmptyState
            icon={<AlertCircle className="w-6 h-6" />}
            title="Nessuna azione trovata"
            description="Modifica i filtri oppure crea una nuova azione correttiva."
          />
        ) : (
          Object.entries(groupedActions).map(([assessmentTitle, groupActions]) => (
            <Card key={assessmentTitle} className="overflow-hidden">
              {/* Header Assessment */}
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-5 h-5 text-sky-700" />
                  {assessmentTitle}
                  <span className="text-sm font-medium text-slate-500">({groupActions.length} azioni)</span>
                </CardTitle>
              </CardHeader>

              {/* Lista Azioni */}
              <div className="divide-y divide-gray-100">
                {groupActions.map(action => (
                  <div key={action.id} className="p-4 transition hover:bg-slate-50">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(action.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">{action.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-sm text-slate-500">
                            Rischio: {action.risk_item?.risk_catalog_base?.name || action.risk_item?.custom_risk_name || 'N/D'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
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
                          className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${getFMEAActionStatusColor(action.status)}`}
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
            </Card>
          ))
        )}
      </div>

      {/* Modal Nuova Azione - Multi Step */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Nuova Azione Correttiva</h3>
                <p className="mt-1 text-sm text-slate-500">Collega l'intervento a un rischio FMEA gia valutato.</p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-5 pt-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 1 ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>1</div>
                  <span className={`text-sm ${step >= 1 ? 'font-medium text-sky-700' : 'text-slate-500'}`}>Assessment</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 2 ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>2</div>
                  <span className={`text-sm ${step >= 2 ? 'font-medium text-sky-700' : 'text-slate-500'}`}>Rischio</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 3 ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>3</div>
                  <span className={`text-sm ${step >= 3 ? 'font-medium text-sky-700' : 'text-slate-500'}`}>Dettagli</span>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="px-5 pb-5">
              {/* Step 1: Seleziona Assessment */}
              {step === 1 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Seleziona l'Assessment
                  </label>
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {assessments.length === 0 ? (
                      <p className="py-4 text-center text-sm text-slate-500">Nessun assessment trovato</p>
                    ) : (
                      assessments.map(assessment => (
                        <button
                          key={assessment.id}
                          onClick={() => setSelectedAssessment(assessment.id)}
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            selectedAssessment === assessment.id
                              ? 'border-sky-200 bg-sky-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className={`w-5 h-5 ${
                              selectedAssessment === assessment.id ? 'text-sky-700' : 'text-slate-400'
                            }`} />
                            <div>
                              <p className="font-medium text-slate-900">{assessment.title}</p>
                              <p className="text-sm text-slate-500">
                                {new Date(assessment.created_at).toLocaleDateString('it-IT')} • {
                                  assessment.status === 'completed' ? 'Completato' : 
                                  assessment.status === 'in_progress' ? 'In corso' : 'Bozza'
                                }
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Seleziona Rischio */}
              {step === 2 && (
                <div>
                  <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 p-3">
                    <p className="text-sm text-sky-800">
                      <span className="font-medium">Assessment:</span> {getSelectedAssessmentTitle()}
                    </p>
                  </div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Seleziona il Rischio
                  </label>
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {filteredRiskItems.length === 0 ? (
                      <p className="py-4 text-center text-sm text-slate-500">Nessun rischio in questo assessment</p>
                    ) : (
                      filteredRiskItems.map(risk => (
                        <button
                          key={risk.id}
                          onClick={() => setSelectedRiskItem(risk.id)}
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            selectedRiskItem === risk.id
                              ? 'border-sky-200 bg-sky-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">
                                {risk.risk_catalog_base?.name || risk.custom_risk_name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {risk.risk_catalog_base?.category || 'Personalizzato'} • RPN: {risk.rpn || 'N/D'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFMEARiskClassColor(risk.risk_class)}`}>
                              {risk.risk_class || 'N/D'}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Dettagli Azione */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                    <p className="text-sm text-sky-800">
                      <span className="font-medium">Assessment:</span> {getSelectedAssessmentTitle()}
                    </p>
                    <p className="text-sm text-sky-800 mt-1">
                      <span className="font-medium">Rischio:</span> {getSelectedRiskName()}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Descrizione Azione *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="clinical-input resize-none px-4 py-2"
                      placeholder="Descrivi l'azione correttiva..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Responsabile
                      </label>
                      <input
                        type="text"
                        value={responsible}
                        onChange={(e) => setResponsible(e.target.value)}
                        className="clinical-input px-4 py-2"
                        placeholder="Nome responsabile"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Data Scadenza
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="clinical-input px-4 py-2"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between border-t border-slate-100 p-5">
              <button
                onClick={step === 1 ? () => { setShowAddModal(false); resetForm(); } : handlePrevStep}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                {step === 1 ? 'Annulla' : 'Indietro'}
              </button>
              
              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  disabled={(step === 1 && !selectedAssessment) || (step === 2 && !selectedRiskItem)}
                  className="rounded-lg bg-sky-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Avanti
                </button>
              ) : (
                <button
                  onClick={addAction}
                  disabled={!description.trim() || saving}
                  className="rounded-lg bg-sky-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Salvataggio...' : 'Aggiungi Azione'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
