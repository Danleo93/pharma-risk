import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, ClipboardList, MapPin, Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { RCAAssessment, RCAAssessmentStatus, RCAEventType, RCAMethodology, RCASeverity } from '../../types'

const statusLabels: Record<RCAAssessmentStatus, string> = {
  draft: 'Bozza',
  in_progress: 'In corso',
  action_planned: 'Azioni pianificate',
  completed: 'Completato',
  archived: 'Archiviato',
}

const eventTypeLabels: Record<RCAEventType, string> = {
  incident: 'Incidente',
  near_miss: 'Near miss',
  non_conformity: 'Non conformita',
  complaint: 'Reclamo',
  other: 'Altro',
}

const severityLabels: Record<RCASeverity, string> = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
  critical: 'Critica',
}

const methodologyLabels: Record<RCAMethodology, string> = {
  '5_whys': '5 Whys',
  fishbone: 'Ishikawa',
  combined: 'Combinata',
}

type RCATab = 'event' | 'ishikawa' | 'five_whys' | 'causes' | 'actions' | 'report'

const tabs: { key: RCATab; label: string }[] = [
  { key: 'event', label: 'Evento' },
  { key: 'ishikawa', label: 'Ishikawa' },
  { key: 'five_whys', label: '5 Whys' },
  { key: 'causes', label: 'Cause' },
  { key: 'actions', label: 'Azioni' },
  { key: 'report', label: 'Report' },
]

const ISHIKAWA_STANDARD_CATEGORIES = [
  { key: 'people', label: 'Persone' },
  { key: 'processes_procedures', label: 'Processi/Procedure' },
  { key: 'technology_equipment', label: 'Tecnologie/Attrezzature' },
  { key: 'drugs_materials', label: 'Farmaci/Materiali' },
  { key: 'environment', label: 'Ambiente' },
  { key: 'organization', label: 'Organizzazione' },
  { key: 'controls_monitoring', label: 'Controlli/Monitoraggio' },
] as const

type IshikawaStandardCategoryKey = typeof ISHIKAWA_STANDARD_CATEGORIES[number]['key']

interface RCAFishboneDiagram {
  id: string
  assessment_id: string
  user_id: string
  title: string
  effect_statement: string
  status: 'draft' | 'completed'
  created_at: string
  updated_at: string
}

interface RCAFishboneBranch {
  id: string
  diagram_id: string
  assessment_id: string
  user_id: string
  name: string
  source_type: 'standard' | 'custom'
  standard_key: IshikawaStandardCategoryKey | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface RCACause {
  id: string
  assessment_id: string
  user_id: string
  description: string
  category: string | null
  source_type: 'five_whys' | 'fishbone' | 'manual'
  is_root_cause: boolean
  confidence_level: 'low' | 'medium' | 'high' | null
  evidence: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface RCAFishboneCause {
  id: string
  branch_id: string
  assessment_id: string
  user_id: string
  cause_id: string
  parent_id: string | null
  sort_order: number
  created_at: string
  cause?: RCACause
}

export default function RCAAssessmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [assessment, setAssessment] = useState<RCAAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<RCATab>('event')
  const [fishboneDiagram, setFishboneDiagram] = useState<RCAFishboneDiagram | null>(null)
  const [fishboneBranches, setFishboneBranches] = useState<RCAFishboneBranch[]>([])
  const [fishboneLoading, setFishboneLoading] = useState(false)
  const [fishboneSaving, setFishboneSaving] = useState(false)
  const [fishboneError, setFishboneError] = useState<string | null>(null)
  const [showCustomBranchForm, setShowCustomBranchForm] = useState(false)
  const [customBranchName, setCustomBranchName] = useState('')
  const [fishboneCausesByBranch, setFishboneCausesByBranch] = useState<Record<string, RCAFishboneCause[]>>({})
  const [activeCauseFormBranchId, setActiveCauseFormBranchId] = useState<string | null>(null)
  const [newCauseDescription, setNewCauseDescription] = useState('')
  const [causeSaving, setCauseSaving] = useState(false)
  const [causeError, setCauseError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !user) return
    fetchAssessment()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id])

  useEffect(() => {
    if (activeTab !== 'ishikawa' || !assessment || !user) return
    fetchFishboneDiagram()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, assessment?.id, user?.id])

  const fetchAssessment = async () => {
    if (!id || !user) return

    const { data, error } = await supabase
      .from('rca_assessments')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Errore caricamento RCA:', error)
      navigate('/rca/assessments')
      return
    }

    setAssessment(data)
    setLoading(false)
  }

  const fetchFishboneDiagram = async () => {
    if (!assessment || !user) return

    setFishboneLoading(true)
    setFishboneError(null)

    const { data, error } = await supabase
      .from('rca_fishbone_diagrams')
      .select('*')
      .eq('assessment_id', assessment.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Errore caricamento Ishikawa:', error)
      setFishboneError('Errore durante il caricamento del diagramma Ishikawa')
      setFishboneLoading(false)
      return
    }

    const diagram = data as RCAFishboneDiagram | null
    setFishboneDiagram(diagram)

    if (diagram) {
      await fetchFishboneBranches(diagram.id)
    } else {
      setFishboneBranches([])
    }

    setFishboneLoading(false)
  }

  const fetchFishboneBranches = async (diagramId: string) => {
    if (!assessment || !user) return

    const { data, error } = await supabase
      .from('rca_fishbone_branches')
      .select('*')
      .eq('diagram_id', diagramId)
      .eq('assessment_id', assessment.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Errore caricamento categorie Ishikawa:', error)
      setFishboneError('Errore durante il caricamento delle categorie Ishikawa')
      return
    }

    const branches = (data || []) as RCAFishboneBranch[]
    setFishboneBranches(branches)
    await fetchFishboneCauses(branches)
  }

  const fetchFishboneCauses = async (branches: RCAFishboneBranch[]) => {
    if (!assessment || !user) return

    if (branches.length === 0) {
      setFishboneCausesByBranch({})
      return
    }

    const { data, error } = await supabase
      .from('rca_fishbone_causes')
      .select(`
        *,
        cause:rca_causes (*)
      `)
      .eq('assessment_id', assessment.id)
      .eq('user_id', user.id)
      .in('branch_id', branches.map((branch) => branch.id))
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Errore caricamento cause Ishikawa:', error)
      setFishboneError('Errore durante il caricamento delle cause Ishikawa')
      return
    }

    const grouped = ((data || []) as RCAFishboneCause[]).reduce<Record<string, RCAFishboneCause[]>>((acc, item) => {
      if (!acc[item.branch_id]) acc[item.branch_id] = []
      acc[item.branch_id].push(item)
      return acc
    }, {})

    setFishboneCausesByBranch(grouped)
  }

  const createFishboneDiagram = async () => {
    if (!assessment || !user) return

    setFishboneSaving(true)
    setFishboneError(null)

    const { data, error } = await supabase
      .from('rca_fishbone_diagrams')
      .insert({
        assessment_id: assessment.id,
        user_id: user.id,
        title: `Ishikawa - ${assessment.event_title || assessment.title}`,
        effect_statement: assessment.event_description || assessment.event_title,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Errore creazione Ishikawa:', error)
      setFishboneError('Errore durante la creazione del diagramma Ishikawa')
      setFishboneSaving(false)
      return
    }

    setFishboneDiagram(data as RCAFishboneDiagram)
    setFishboneBranches([])
    setFishboneCausesByBranch({})
    setFishboneSaving(false)
  }

  const getNextBranchSortOrder = () => {
    if (fishboneBranches.length === 0) return 0
    return Math.max(...fishboneBranches.map((branch) => branch.sort_order)) + 1
  }

  const isStandardCategoryActive = (key: IshikawaStandardCategoryKey) => {
    return fishboneBranches.some((branch) => branch.source_type === 'standard' && branch.standard_key === key)
  }

  const getActiveStandardBranch = (key: IshikawaStandardCategoryKey) => {
    return fishboneBranches.find((branch) => branch.source_type === 'standard' && branch.standard_key === key)
  }

  const canAddFishboneBranch = fishboneBranches.length < 8

  const addStandardBranch = async (category: typeof ISHIKAWA_STANDARD_CATEGORIES[number]) => {
    if (!assessment || !user || !fishboneDiagram) return
    if (isStandardCategoryActive(category.key) || !canAddFishboneBranch) return

    setFishboneSaving(true)
    setFishboneError(null)

    const { data, error } = await supabase
      .from('rca_fishbone_branches')
      .insert({
        diagram_id: fishboneDiagram.id,
        assessment_id: assessment.id,
        user_id: user.id,
        name: category.label,
        source_type: 'standard',
        standard_key: category.key,
        is_active: true,
        sort_order: getNextBranchSortOrder(),
      })
      .select()
      .single()

    if (error) {
      console.error('Errore aggiunta categoria Ishikawa:', error)
      setFishboneError('Errore durante l aggiunta della categoria')
    } else {
      setFishboneBranches([...fishboneBranches, data as RCAFishboneBranch])
    }

    setFishboneSaving(false)
  }

  const addCustomBranch = async () => {
    if (!assessment || !user || !fishboneDiagram || !canAddFishboneBranch) return

    const name = customBranchName.trim()
    if (!name) {
      setFishboneError('Inserisci un nome per la categoria custom')
      return
    }

    const isDuplicate = fishboneBranches.some((branch) => branch.name.toLowerCase() === name.toLowerCase())
    if (isDuplicate) {
      setFishboneError('Esiste gia una categoria attiva con questo nome')
      return
    }

    setFishboneSaving(true)
    setFishboneError(null)

    const { data, error } = await supabase
      .from('rca_fishbone_branches')
      .insert({
        diagram_id: fishboneDiagram.id,
        assessment_id: assessment.id,
        user_id: user.id,
        name: name.trim(),
        source_type: 'custom',
        standard_key: null,
        is_active: true,
        sort_order: getNextBranchSortOrder(),
      })
      .select()
      .single()

    if (error) {
      console.error('Errore aggiunta categoria custom:', error)
      setFishboneError('Errore durante l aggiunta della categoria custom')
    } else {
      setFishboneBranches([...fishboneBranches, data as RCAFishboneBranch])
      setCustomBranchName('')
      setShowCustomBranchForm(false)
    }

    setFishboneSaving(false)
  }

  const cancelCustomBranchForm = () => {
    setCustomBranchName('')
    setShowCustomBranchForm(false)
    setFishboneError(null)
  }

  const removeFishboneBranch = async (branch: RCAFishboneBranch) => {
    if (!user) return
    if (!confirm(`Rimuovere la categoria "${branch.name}" dal diagramma?`)) return

    setFishboneError(null)

    const { error } = await supabase
      .from('rca_fishbone_branches')
      .update({ is_active: false })
      .eq('id', branch.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Errore rimozione categoria Ishikawa:', error)
      setFishboneError('Errore durante la rimozione della categoria')
      return
    }

    setFishboneBranches(fishboneBranches.filter((item) => item.id !== branch.id))
    setFishboneCausesByBranch((current) => {
      const next = { ...current }
      delete next[branch.id]
      return next
    })
  }

  const getNextCauseSortOrder = (branchId: string) => {
    const causes = fishboneCausesByBranch[branchId] || []
    if (causes.length === 0) return 0
    return Math.max(...causes.map((cause) => cause.sort_order)) + 1
  }

  const startAddCause = (branchId: string) => {
    setActiveCauseFormBranchId(branchId)
    setNewCauseDescription('')
    setCauseError(null)
  }

  const cancelAddCause = () => {
    setActiveCauseFormBranchId(null)
    setNewCauseDescription('')
    setCauseError(null)
  }

  const saveFishboneCause = async (branch: RCAFishboneBranch) => {
    if (!assessment || !user) return

    const description = newCauseDescription.trim()
    if (!description) {
      setCauseError('Inserisci una descrizione della causa')
      return
    }

    setCauseSaving(true)
    setCauseError(null)

    const { data: causeData, error: causeInsertError } = await supabase
      .from('rca_causes')
      .insert({
        assessment_id: assessment.id,
        user_id: user.id,
        description,
        category: branch.name,
        source_type: 'fishbone',
        is_root_cause: false,
      })
      .select()
      .single()

    if (causeInsertError) {
      console.error('Errore creazione causa Ishikawa:', causeInsertError)
      setCauseError('Errore durante la creazione della causa')
      setCauseSaving(false)
      return
    }

    const cause = causeData as RCACause
    const { data: fishboneCauseData, error: fishboneCauseInsertError } = await supabase
      .from('rca_fishbone_causes')
      .insert({
        branch_id: branch.id,
        assessment_id: assessment.id,
        user_id: user.id,
        cause_id: cause.id,
        parent_id: null,
        sort_order: getNextCauseSortOrder(branch.id),
      })
      .select()
      .single()

    if (fishboneCauseInsertError) {
      console.error('Errore collegamento causa Ishikawa:', fishboneCauseInsertError)
      setCauseError('Causa creata, ma errore durante il collegamento al diagramma')
      setCauseSaving(false)
      return
    }

    const fishboneCause = { ...(fishboneCauseData as RCAFishboneCause), cause }
    setFishboneCausesByBranch({
      ...fishboneCausesByBranch,
      [branch.id]: [...(fishboneCausesByBranch[branch.id] || []), fishboneCause],
    })
    setActiveCauseFormBranchId(null)
    setNewCauseDescription('')
    setCauseSaving(false)
  }

  const getStatusColor = (status: RCAAssessmentStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
      case 'action_planned':
        return 'bg-yellow-100 text-yellow-700'
      case 'draft':
      case 'archived':
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getSeverityColor = (severity: RCASeverity | null) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'critical':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatEventTime = (time: string | null) => {
    if (!time) return 'Non specificata'
    return time.slice(0, 5)
  }

  const isTabEnabled = (tab: RCATab, methodology: RCAMethodology | null) => {
    if (tab === 'event') return true
    if (tab === 'ishikawa') return methodology === 'fishbone' || methodology === 'combined'
    if (tab === 'five_whys') return methodology === '5_whys' || methodology === 'combined'
    return false
  }

  const renderMethodologyCTA = (methodology: RCAMethodology | null) => {
    if (!methodology) {
      return (
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
        >
          Seleziona metodologia
        </button>
      )
    }

    if (methodology === '5_whys') {
      return (
        <button
          type="button"
          onClick={() => setActiveTab('five_whys')}
          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition"
        >
          Inizia 5 Whys
        </button>
      )
    }

    if (methodology === 'fishbone') {
      return (
        <button
          type="button"
          onClick={() => setActiveTab('ishikawa')}
          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition"
        >
          Inizia Ishikawa
        </button>
      )
    }

    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setActiveTab('ishikawa')}
          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition"
        >
          Inizia Ishikawa
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('five_whys')}
          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-white text-sky-700 border border-sky-200 rounded-lg font-medium hover:bg-sky-50 transition"
        >
          Continua con 5 Whys
        </button>
      </div>
    )
  }

  const renderPlaceholder = (title: string, description: string) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
      <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <p className="text-gray-500 mt-2 max-w-2xl mx-auto">{description}</p>
    </div>
  )

  const renderIshikawaTab = () => {
    if (fishboneLoading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento diagramma Ishikawa...
        </div>
      )
    }

    if (!fishboneDiagram) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Diagramma Ishikawa</h2>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            Crea il diagramma principale per organizzare le categorie causali dell'evento.
            Le cause verranno aggiunte in una fase successiva.
          </p>
          {fishboneError && (
            <div className="mt-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm inline-block">
              {fishboneError}
            </div>
          )}
          <div className="mt-6">
            <button
              type="button"
              onClick={createFishboneDiagram}
              disabled={fishboneSaving}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-lg font-medium transition disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              {fishboneSaving ? 'Creazione...' : 'Crea diagramma Ishikawa'}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{fishboneDiagram.title}</h2>
              <p className="text-gray-500 mt-1">{fishboneDiagram.effect_statement}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium self-start">
              {fishboneDiagram.status === 'completed' ? 'Completato' : 'Bozza'}
            </span>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Categorie Ishikawa</h3>
              <p className="text-sm text-gray-500">
                Seleziona categorie standard o aggiungi categorie custom. Massimo 8 categorie attive.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomBranchForm(true)}
              disabled={!canAddFishboneBranch || fishboneSaving}
              className="inline-flex items-center gap-2 bg-white text-sky-700 border border-sky-200 px-4 py-2.5 rounded-lg font-medium hover:bg-sky-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Aggiungi categoria
            </button>
          </div>

          {showCustomBranchForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                addCustomBranch()
              }}
              className="mb-4 rounded-lg border border-sky-100 bg-sky-50 p-4"
            >
              <label className="block text-sm font-medium text-sky-900 mb-2">
                Nome categoria personalizzata
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={customBranchName}
                  onChange={(e) => setCustomBranchName(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-sky-200 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  placeholder="Es: Comunicazione"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={fishboneSaving || !canAddFishboneBranch}
                  className="px-4 py-2.5 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salva
                </button>
                <button
                  type="button"
                  onClick={cancelCustomBranchForm}
                  className="px-4 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Annulla
                </button>
              </div>
            </form>
          )}

          {fishboneError && (
            <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {fishboneError}
            </div>
          )}

          {!canAddFishboneBranch && (
            <div className="mb-4 bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg text-sm">
              Limite massimo di 8 categorie attive raggiunto.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ISHIKAWA_STANDARD_CATEGORIES.map((category) => {
              const activeBranch = getActiveStandardBranch(category.key)
              const active = Boolean(activeBranch)
              const disabled = (!active && !canAddFishboneBranch) || fishboneSaving

              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => activeBranch ? removeFishboneBranch(activeBranch) : addStandardBranch(category)}
                  disabled={disabled}
                  className={`
                    text-left p-4 rounded-lg border transition
                    ${active
                      ? 'border-sky-300 bg-sky-50 text-sky-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-sky-300 hover:bg-sky-50'}
                    ${disabled ? 'disabled:cursor-not-allowed disabled:opacity-50' : ''}
                  `}
                >
                  <p className="font-medium">{category.label}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {active ? 'Attiva nel diagramma' : 'Aggiungi categoria standard'}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Categorie attive</h3>
              <p className="text-sm text-gray-500">{fishboneBranches.length} di 8 categorie selezionate</p>
            </div>
          </div>

          {fishboneBranches.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-500">
              Nessuna categoria attiva. Seleziona una categoria standard o aggiungine una custom.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fishboneBranches.map((branch, index) => (
                <div key={branch.id} className="p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800">{branch.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {branch.source_type === 'standard' ? 'Categoria standard' : 'Categoria custom'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFishboneBranch(branch)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Rimuovi categoria"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Cause</h4>
                      <button
                        type="button"
                        onClick={() => startAddCause(branch.id)}
                        className="inline-flex items-center gap-1.5 text-sm text-sky-700 hover:text-sky-800 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Aggiungi causa
                      </button>
                    </div>

                    {(fishboneCausesByBranch[branch.id] || []).length === 0 ? (
                      <p className="text-sm text-gray-400">Nessuna causa inserita.</p>
                    ) : (
                      <div className="space-y-2">
                        {(fishboneCausesByBranch[branch.id] || []).map((fishboneCause, causeIndex) => (
                          <div key={fishboneCause.id} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
                            <span className="mt-0.5 text-xs font-medium text-gray-400">
                              {causeIndex + 1}.
                            </span>
                            <p className="text-sm text-gray-700">
                              {fishboneCause.cause?.description || 'Causa senza descrizione'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeCauseFormBranchId === branch.id && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          saveFishboneCause(branch)
                        }}
                        className="mt-3 rounded-lg border border-sky-100 bg-sky-50 p-3"
                      >
                        <label className="block text-sm font-medium text-sky-900 mb-2">
                          Nuova causa
                        </label>
                        <div className="flex flex-col gap-3">
                          <input
                            type="text"
                            value={newCauseDescription}
                            onChange={(e) => setNewCauseDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-sky-200 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                            placeholder="Descrivi la causa..."
                            autoFocus
                          />
                          {causeError && (
                            <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm">
                              {causeError}
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                            <button
                              type="button"
                              onClick={cancelAddCause}
                              className="px-3 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition"
                            >
                              Annulla
                            </button>
                            <button
                              type="submit"
                              disabled={causeSaving}
                              className="px-3 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition disabled:opacity-50"
                            >
                              {causeSaving ? 'Salvataggio...' : 'Salva'}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!assessment) return null

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/rca/assessments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna agli Assessment RCA
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{assessment.title}</h1>
            <p className="text-gray-500 mt-1">{assessment.event_title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment.status)}`}>
              {statusLabels[assessment.status]}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(assessment.severity)}`}>
              {assessment.severity ? severityLabels[assessment.severity] : 'Severita N/D'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const enabled = isTabEnabled(tab.key, assessment.methodology)
            const active = activeTab === tab.key

            return (
              <button
                key={tab.key}
                type="button"
                disabled={!enabled}
                onClick={() => enabled && setActiveTab(tab.key)}
                className={`
                  px-4 py-2.5 rounded-lg text-sm font-medium transition
                  ${active
                    ? 'bg-sky-600 text-white'
                    : enabled
                      ? 'text-gray-600 hover:bg-sky-50 hover:text-sky-700'
                      : 'text-gray-300 cursor-not-allowed'}
                `}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'event' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Evento</h2>
            </div>

            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Tipo evento</dt>
                <dd className="font-medium text-gray-800">
                  {assessment.event_type ? eventTypeLabels[assessment.event_type] : 'Non specificato'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Metodologia prevista</dt>
                <dd className="font-medium text-gray-800">
                  {assessment.methodology ? methodologyLabels[assessment.methodology] : 'Da definire'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Data evento</dt>
                <dd className="font-medium text-gray-800">
                  {assessment.event_date ? new Date(assessment.event_date).toLocaleDateString('it-IT') : 'Non specificata'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Ora evento</dt>
                <dd className="font-medium text-gray-800">{formatEventTime(assessment.event_time)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Luogo</dt>
                <dd className="font-medium text-gray-800">{assessment.location || 'Non specificato'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Reparto / Servizio</dt>
                <dd className="font-medium text-gray-800">{assessment.department || 'Non specificato'}</dd>
              </div>
            </dl>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-medium text-gray-800 mb-2">Descrizione evento</h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {assessment.event_description || 'Nessuna descrizione inserita.'}
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-medium text-gray-800 mb-2">Contenimento immediato</h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {assessment.immediate_containment || 'Nessuna azione di contenimento registrata.'}
              </p>
            </div>
          </section>

          {assessment.description && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Descrizione assessment</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{assessment.description}</p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Riepilogo</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Creato il</p>
                  <p className="font-medium text-gray-800">
                    {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Area coinvolta</p>
                  <p className="font-medium text-gray-800">
                    {[assessment.location, assessment.department].filter(Boolean).join(' - ') || 'Non specificato'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-sky-50 rounded-xl border border-sky-100 p-6">
            <h2 className="font-semibold text-sky-900 mb-2">Percorso di analisi</h2>
            <p className="text-sm text-sky-800 mb-4">
              Prosegui con la metodologia RCA prevista per questo assessment.
            </p>
            {renderMethodologyCTA(assessment.methodology)}
          </div>
        </aside>
      </div>
      ) : activeTab === 'ishikawa' ? (
        renderIshikawaTab()
      ) : activeTab === 'five_whys' ? (
        renderPlaceholder(
          '5 Whys',
          'La sequenza di domande per identificare la causa radice sara disponibile qui nelle prossime fasi.',
        )
      ) : activeTab === 'causes' ? (
        renderPlaceholder(
          'Cause',
          'La lista unificata delle cause RCA sara attivata dopo Ishikawa e 5 Whys.',
        )
      ) : activeTab === 'actions' ? (
        renderPlaceholder(
          'Azioni',
          'Le azioni correttive RCA saranno collegate alle cause identificate.',
        )
      ) : (
        renderPlaceholder(
          'Report',
          'Il report RCA riepiloghera evento, analisi, cause radice e azioni correttive.',
        )
      )}
    </div>
  )
}
