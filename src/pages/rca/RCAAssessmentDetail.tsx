import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Calendar, ChevronDown, ChevronRight, ClipboardList, MapPin, Plus, Target, X } from 'lucide-react'
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
type CauseFilter = 'all' | 'candidates' | 'with_actions' | 'without_actions'

const tabs: { key: RCATab; label: string }[] = [
  { key: 'event', label: 'Evento' },
  { key: 'ishikawa', label: 'Ishikawa' },
  { key: 'five_whys', label: '5 Whys' },
  { key: 'causes', label: 'Cause' },
  { key: 'actions', label: 'Azioni' },
  { key: 'report', label: 'Report' },
]

const isValidTab = (value: string | null): value is RCATab => {
  return tabs.some((tab) => tab.key === value)
}

const FIVE_WHYS_MAX_STEPS = 5

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

interface RCAActionPlan {
  id: string
  assessment_id: string
  cause_id: string | null
  user_id: string
  description: string
  responsible: string | null
  due_date: string | null
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical' | null
  completion_date: string | null
  effectiveness_check: string | null
  notes: string | null
  created_at: string
  updated_at: string
  cause?: Pick<RCACause, 'description' | 'category' | 'is_root_cause'> | null
}

interface RCAFiveWhyChain {
  id: string
  assessment_id: string
  cause_id: string | null
  user_id: string
  title: string
  problem_statement: string
  status: 'draft' | 'completed'
  created_at: string
  updated_at: string
  cause?: Pick<RCACause, 'description' | 'category' | 'is_root_cause'> | null
}

interface RCAFiveWhyStep {
  id: string
  chain_id: string
  assessment_id: string
  user_id: string
  step_number: number
  why_question: string
  answer: string
  is_root_step: boolean
  created_at: string
  updated_at: string
}

export default function RCAAssessmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
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
  const [activeActionFormCauseId, setActiveActionFormCauseId] = useState<string | null>(null)
  const [actionDescription, setActionDescription] = useState('')
  const [actionResponsible, setActionResponsible] = useState('')
  const [actionDueDate, setActionDueDate] = useState('')
  const [actionPriority, setActionPriority] = useState<'' | 'low' | 'medium' | 'high' | 'critical'>('')
  const [actionSaving, setActionSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccessCauseId, setActionSuccessCauseId] = useState<string | null>(null)
  const [rcaActions, setRcaActions] = useState<RCAActionPlan[]>([])
  const [actionsLoading, setActionsLoading] = useState(false)
  const [actionsError, setActionsError] = useState<string | null>(null)
  const [fiveWhyChains, setFiveWhyChains] = useState<RCAFiveWhyChain[]>([])
  const [fiveWhyStepsByChain, setFiveWhyStepsByChain] = useState<Record<string, RCAFiveWhyStep[]>>({})
  const [fiveWhyLoading, setFiveWhyLoading] = useState(false)
  const [fiveWhySaving, setFiveWhySaving] = useState(false)
  const [fiveWhyError, setFiveWhyError] = useState<string | null>(null)
  const [expandedFiveWhyChainId, setExpandedFiveWhyChainId] = useState<string | null>(null)
  const [activeFiveWhyFormChainId, setActiveFiveWhyFormChainId] = useState<string | null>(null)
  const [newFiveWhyAnswer, setNewFiveWhyAnswer] = useState('')
  const [causeFilter, setCauseFilter] = useState<CauseFilter>('all')
  const tabParam = searchParams.get('tab')

  useEffect(() => {
    if (!id || !user) return
    fetchAssessment()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id])

  useEffect(() => {
    if (!assessment) return

    const nextTab =
      isValidTab(tabParam) && isTabEnabled(tabParam, assessment.methodology)
        ? tabParam
        : 'event'

    setActiveTab(nextTab)

    if (tabParam !== nextTab) {
      setSearchParams({ tab: nextTab }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment?.id, assessment?.methodology, tabParam])

  useEffect(() => {
    if ((activeTab !== 'ishikawa' && activeTab !== 'five_whys' && activeTab !== 'causes') || !assessment || !user) return
    fetchFishboneDiagram()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, assessment?.id, user?.id])

  useEffect(() => {
    if ((activeTab !== 'five_whys' && activeTab !== 'ishikawa' && activeTab !== 'causes') || !assessment || !user) return
    fetchFiveWhyChains()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, assessment?.id, user?.id])

  useEffect(() => {
    if (!assessment || !user) return
    fetchRCAActions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment?.id, user?.id])

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

  const fetchRCAActions = async () => {
    if (!assessment || !user) return

    setActionsLoading(true)
    setActionsError(null)

    const { data, error } = await supabase
      .from('rca_action_plans')
      .select(`
        *,
        cause:rca_causes (description, category, is_root_cause)
      `)
      .eq('assessment_id', assessment.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore caricamento azioni RCA:', error)
      setActionsError('Errore durante il caricamento delle azioni RCA')
    } else {
      setRcaActions((data || []) as RCAActionPlan[])
    }

    setActionsLoading(false)
  }

  const fetchFiveWhyChains = async () => {
    if (!assessment || !user) return

    setFiveWhyLoading(true)
    setFiveWhyError(null)

    const { data, error } = await supabase
      .from('rca_five_why_chains')
      .select(`
        *,
        cause:rca_causes (description, category, is_root_cause)
      `)
      .eq('assessment_id', assessment.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Errore caricamento 5 Whys:', error)
      setFiveWhyError('Errore durante il caricamento dell analisi 5 Whys')
      setFiveWhyLoading(false)
      return
    }

    const chains = (data || []) as RCAFiveWhyChain[]
    setFiveWhyChains(chains)
    await fetchFiveWhySteps(chains)
    setFiveWhyLoading(false)
  }

  const fetchFiveWhySteps = async (chains: RCAFiveWhyChain[]) => {
    if (!assessment || !user) return

    if (chains.length === 0) {
      setFiveWhyStepsByChain({})
      return
    }

    const { data, error } = await supabase
      .from('rca_five_why_steps')
      .select('*')
      .eq('assessment_id', assessment.id)
      .eq('user_id', user.id)
      .in('chain_id', chains.map((chain) => chain.id))
      .order('step_number', { ascending: true })

    if (error) {
      console.error('Errore caricamento step 5 Whys:', error)
      setFiveWhyError('Errore durante il caricamento degli step 5 Whys')
      return
    }

    const grouped = ((data || []) as RCAFiveWhyStep[]).reduce<Record<string, RCAFiveWhyStep[]>>((acc, step) => {
      if (!acc[step.chain_id]) acc[step.chain_id] = []
      acc[step.chain_id].push(step)
      return acc
    }, {})

    setFiveWhyStepsByChain(grouped)
  }

  const getFiveWhyChainForCause = (causeId: string) => {
    return fiveWhyChains.find((chain) => chain.cause_id === causeId)
  }

  const createFiveWhyChainForCause = async (cause: RCACause) => {
    if (!assessment || !user) return

    const existingChain = getFiveWhyChainForCause(cause.id)
    if (existingChain) {
      setExpandedFiveWhyChainId(existingChain.id)
      changeTab('five_whys')
      return
    }

    setFiveWhySaving(true)
    setFiveWhyError(null)

    const { data, error } = await supabase
      .from('rca_five_why_chains')
      .insert({
        assessment_id: assessment.id,
        user_id: user.id,
        cause_id: cause.id,
        title: `5 Whys - ${cause.description}`,
        problem_statement: cause.description,
        status: 'draft',
      })
      .select(`
        *,
        cause:rca_causes (description, category, is_root_cause)
      `)
      .single()

    if (error) {
      console.error('Errore creazione 5 Whys da causa:', error)
      setCauseError('Errore durante la creazione dell analisi 5 Whys')
      setFiveWhySaving(false)
      return
    }

    const chain = data as RCAFiveWhyChain
    setFiveWhyChains([...fiveWhyChains, chain])
    setFiveWhyStepsByChain((current) => ({ ...current, [chain.id]: [] }))
    setExpandedFiveWhyChainId(chain.id)
    setFiveWhySaving(false)
    changeTab('five_whys')
  }

  const toggleFiveWhyChain = (chainId: string) => {
    setExpandedFiveWhyChainId((current) => {
      const next = current === chainId ? null : chainId
      if (current === chainId && activeFiveWhyFormChainId === chainId) {
        setActiveFiveWhyFormChainId(null)
        setNewFiveWhyAnswer('')
        setFiveWhyError(null)
      }
      return next
    })
  }

  const getNextFiveWhyStepNumber = (chainId: string) => {
    const steps = fiveWhyStepsByChain[chainId] || []
    if (steps.length === 0) return 1
    return Math.max(...steps.map((step) => step.step_number)) + 1
  }

  const startAddFiveWhyStep = (chainId: string) => {
    setActiveFiveWhyFormChainId(chainId)
    setNewFiveWhyAnswer('')
    setFiveWhyError(null)
  }

  const cancelAddFiveWhyStep = () => {
    setActiveFiveWhyFormChainId(null)
    setNewFiveWhyAnswer('')
    setFiveWhyError(null)
  }

  const saveFiveWhyStep = async (chain: RCAFiveWhyChain) => {
    if (!assessment || !user) return

    const currentSteps = fiveWhyStepsByChain[chain.id] || []
    if (currentSteps.length >= FIVE_WHYS_MAX_STEPS) {
      setFiveWhyError('Limite di 5 perche raggiunto.')
      return
    }

    const answer = newFiveWhyAnswer.trim()
    if (!answer) {
      setFiveWhyError('Inserisci una risposta per il perche')
      return
    }

    const stepNumber = getNextFiveWhyStepNumber(chain.id)
    setFiveWhySaving(true)
    setFiveWhyError(null)

    const { data, error } = await supabase
      .from('rca_five_why_steps')
      .insert({
        assessment_id: assessment.id,
        chain_id: chain.id,
        user_id: user.id,
        step_number: stepNumber,
        why_question: `Perché? #${stepNumber}`,
        answer,
        is_root_step: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Errore creazione step 5 Whys:', error)
      setFiveWhyError('Errore durante il salvataggio del perche')
      setFiveWhySaving(false)
      return
    }

    const step = data as RCAFiveWhyStep
    setFiveWhyStepsByChain({
      ...fiveWhyStepsByChain,
      [chain.id]: [...(fiveWhyStepsByChain[chain.id] || []), step],
    })
    setActiveFiveWhyFormChainId(null)
    setNewFiveWhyAnswer('')
    setFiveWhySaving(false)
  }

  const deleteFiveWhyChain = async (chainId: string) => {
    if (!user) return

    const confirmed = confirm('Eliminare questa analisi 5 Whys? Gli step collegati verranno eliminati.')
    if (!confirmed) return

    const { error } = await supabase
      .from('rca_five_why_chains')
      .delete()
      .eq('id', chainId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Errore eliminazione chain 5 Whys:', error)
      setFiveWhyError('Errore durante l eliminazione dell analisi 5 Whys')
      return
    }

    setFiveWhyChains((current) => current.filter((chain) => chain.id !== chainId))
    setFiveWhyStepsByChain((current) => {
      const next = { ...current }
      delete next[chainId]
      return next
    })
    setExpandedFiveWhyChainId((current) => (current === chainId ? null : current))
    setActiveFiveWhyFormChainId((current) => (current === chainId ? null : current))
  }

  const deleteFiveWhyStep = async (step: RCAFiveWhyStep) => {
    if (!user) return

    const confirmed = confirm('Eliminare questo step 5 Whys?')
    if (!confirmed) return

    const { error } = await supabase
      .from('rca_five_why_steps')
      .delete()
      .eq('id', step.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Errore eliminazione step 5 Whys:', error)
      setFiveWhyError('Errore durante l eliminazione dello step 5 Whys')
      return
    }

    setFiveWhyStepsByChain((current) => ({
      ...current,
      [step.chain_id]: (current[step.chain_id] || []).filter((item) => item.id !== step.id),
    }))
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

  const toggleRootCause = async (fishboneCause: RCAFishboneCause) => {
    if (!user || !fishboneCause.cause) return

    const nextValue = !fishboneCause.cause.is_root_cause
    setCauseError(null)

    const { error } = await supabase
      .from('rca_causes')
      .update({ is_root_cause: nextValue })
      .eq('id', fishboneCause.cause.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Errore aggiornamento root cause:', error)
      setCauseError('Errore durante l aggiornamento della causa radice')
      return
    }

    setFishboneCausesByBranch((current) => {
      const next = { ...current }
      next[fishboneCause.branch_id] = (next[fishboneCause.branch_id] || []).map((item) => {
        if (item.id !== fishboneCause.id || !item.cause) return item
        return {
          ...item,
          cause: {
            ...item.cause,
            is_root_cause: nextValue,
          },
        }
      })
      return next
    })
  }

  const startCreateAction = (causeId: string) => {
    setActiveActionFormCauseId(causeId)
    setActionDescription('')
    setActionResponsible('')
    setActionDueDate('')
    setActionPriority('')
    setActionError(null)
    setActionSuccessCauseId(null)
  }

  const cancelCreateAction = () => {
    setActiveActionFormCauseId(null)
    setActionDescription('')
    setActionResponsible('')
    setActionDueDate('')
    setActionPriority('')
    setActionError(null)
  }

  const saveRCAAction = async (cause: RCACause) => {
    if (!assessment || !user) return

    const description = actionDescription.trim()
    if (!description) {
      setActionError('Inserisci una descrizione per l azione correttiva')
      return
    }

    setActionSaving(true)
    setActionError(null)

    const { data, error } = await supabase
      .from('rca_action_plans')
      .insert({
        assessment_id: assessment.id,
        cause_id: cause.id,
        user_id: user.id,
        description,
        responsible: actionResponsible.trim() || null,
        due_date: actionDueDate || null,
        priority: actionPriority || null,
        status: 'planned',
      })
      .select(`
        *,
        cause:rca_causes (description, category, is_root_cause)
      `)
      .single()

    if (error) {
      console.error('Errore creazione azione RCA:', error)
      setActionError('Errore durante la creazione dell azione correttiva')
      setActionSaving(false)
      return
    }

    setActiveActionFormCauseId(null)
    setActionDescription('')
    setActionResponsible('')
    setActionDueDate('')
    setActionPriority('')
    setActionSuccessCauseId(cause.id)
    setRcaActions([data as RCAActionPlan, ...rcaActions])
    setActionSaving(false)
  }

  const deleteRCAAction = async (actionId: string) => {
    if (!user) return

    const confirmed = confirm('Eliminare questa azione correttiva RCA?')
    if (!confirmed) return

    const { error } = await supabase
      .from('rca_action_plans')
      .delete()
      .eq('id', actionId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Errore eliminazione azione RCA:', error)
      setActionsError('Errore durante l eliminazione dell azione RCA')
      return
    }

    setRcaActions((current) => current.filter((action) => action.id !== actionId))
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
    if (tab === 'actions') return true
    if (tab === 'causes') return true
    if (tab === 'ishikawa') return methodology === 'fishbone' || methodology === 'combined'
    if (tab === 'five_whys') return methodology === '5_whys' || methodology === 'fishbone' || methodology === 'combined'
    return false
  }

  const changeTab = (nextTab: RCATab) => {
    if (!assessment || !isTabEnabled(nextTab, assessment.methodology)) return

    setActiveTab(nextTab)
    setSearchParams({ tab: nextTab })
  }

  const getActionsForCause = (causeId: string) => {
    return rcaActions.filter((action) => action.cause_id === causeId)
  }

  const getAllAssessmentCauses = () => {
    const causes = Object.values(fishboneCausesByBranch)
      .flat()
      .map((fishboneCause) => fishboneCause.cause)
      .filter((cause): cause is RCACause => Boolean(cause))

    return causes
      .filter((cause, index, list) => list.findIndex((item) => item.id === cause.id) === index)
      .sort((a, b) => {
        const categoryCompare = (a.category || '').localeCompare(b.category || '')
        if (categoryCompare !== 0) return categoryCompare
        return a.description.localeCompare(b.description)
      })
  }

  const getCandidateRootCauses = () => {
    return getAllAssessmentCauses().filter((cause) => cause.is_root_cause)
  }

  const getActionStatusLabel = (status: RCAActionPlan['status']) => {
    switch (status) {
      case 'completed':
        return 'Completata'
      case 'in_progress':
        return 'In corso'
      case 'cancelled':
        return 'Annullata'
      default:
        return 'Pianificata'
    }
  }

  const getActionStatusColor = (status: RCAActionPlan['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  const getActionPriorityLabel = (priority: RCAActionPlan['priority']) => {
    switch (priority) {
      case 'critical':
        return 'Critica'
      case 'high':
        return 'Alta'
      case 'medium':
        return 'Media'
      case 'low':
        return 'Bassa'
      default:
        return 'N/D'
    }
  }

  const getActionPriorityColor = (priority: RCAActionPlan['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatDate = (date: string | null) => {
    return date ? new Date(date).toLocaleDateString('it-IT') : 'N/D'
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
          onClick={() => changeTab('five_whys')}
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
          onClick={() => changeTab('ishikawa')}
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
          onClick={() => changeTab('ishikawa')}
          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition"
        >
          Inizia Ishikawa
        </button>
        <button
          type="button"
          onClick={() => changeTab('five_whys')}
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

  const renderFishboneVisual = () => {
    const effectTitle = assessment?.event_title || assessment?.title || fishboneDiagram?.title || 'Evento RCA'
    const effectDescription = (assessment?.event_description || fishboneDiagram?.effect_statement || '').trim()
    const shortEffectDescription = effectDescription.length > 140
      ? `${effectDescription.slice(0, 140)}...`
      : effectDescription

    if (fishboneBranches.length === 0) {
      return (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800">Diagramma Ishikawa</h3>
          <p className="text-gray-500 mt-2">
            Attiva almeno una categoria per visualizzare la lisca di pesce.
          </p>
        </section>
      )
    }

    const branchMetas = fishboneBranches.map((branch, index) => {
      const x = fishboneBranches.length === 1
        ? 470
        : 135 + index * (720 / (fishboneBranches.length - 1))

      return {
        branch,
        index,
        x,
        isTop: index % 2 === 0,
        causes: fishboneCausesByBranch[branch.id] || [],
      }
    })

    const renderCausePill = (fishboneCause: RCAFishboneCause) => {
      const cause = fishboneCause.cause
      const isCandidate = Boolean(cause?.is_root_cause)

      return (
        <div
          key={fishboneCause.id}
          className={`
            truncate rounded-full border px-2 py-1 text-xs
            ${isCandidate
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-white border-slate-200 text-slate-600'}
          `}
          title={cause?.description || 'Causa senza descrizione'}
        >
          {cause?.description || 'Causa senza descrizione'}
        </div>
      )
    }

    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Diagramma Ishikawa</h3>
            <p className="text-sm text-gray-500 mt-1">
              Vista grafica read-only delle categorie e delle cause candidate.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-sm font-medium self-start">
            {fishboneBranches.length} categorie attive
          </span>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <div className="relative h-[520px] min-w-[1120px] rounded-xl border border-slate-100 bg-slate-50/60">
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 1120 520"
              role="img"
              aria-label="Diagramma Ishikawa read-only"
            >
              <line x1="80" y1="260" x2="880" y2="260" stroke="#0ea5e9" strokeWidth="5" strokeLinecap="round" />
              <polygon points="880,248 910,260 880,272" fill="#0ea5e9" />
              <line x1="100" y1="245" x2="135" y2="260" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              <line x1="100" y1="275" x2="135" y2="260" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

              {branchMetas.map((meta) => {
                const endY = meta.isTop ? 168 : 352
                const cardY = meta.isTop ? 118 : 402

                return (
                  <g key={meta.branch.id}>
                    <line
                      x1={meta.x}
                      y1="260"
                      x2={meta.x - 40}
                      y2={endY}
                      stroke="#64748b"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.75"
                    />
                    <line
                      x1={meta.x - 40}
                      y1={endY}
                      x2={meta.x}
                      y2={cardY}
                      stroke="#cbd5e1"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                    <circle cx={meta.x} cy="260" r="5" fill="#0ea5e9" />
                  </g>
                )
              })}
            </svg>

            <div className="absolute left-[890px] top-1/2 w-[210px] -translate-y-1/2 rounded-xl border border-sky-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Effetto</p>
              <h4 className="mt-1 text-base font-semibold text-slate-800">{effectTitle}</h4>
              {shortEffectDescription && (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{shortEffectDescription}</p>
              )}
            </div>

            {branchMetas.map((meta) => {
              const visibleCauses = meta.causes.slice(0, 3)
              const remainingCauses = meta.causes.length - visibleCauses.length

              return (
                <div
                  key={meta.branch.id}
                  className="absolute w-[190px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  style={{
                    left: `${meta.x}px`,
                    top: meta.isTop ? '34px' : '348px',
                  }}
                >
                  <p className="text-sm font-semibold text-slate-800">{meta.branch.name}</p>
                  <div className="mt-2 space-y-1.5">
                    {visibleCauses.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-400">
                        Nessuna causa
                      </div>
                    ) : (
                      visibleCauses.map(renderCausePill)
                    )}
                    {remainingCauses > 0 && (
                      <div className="text-xs font-medium text-slate-400">+{remainingCauses} altre cause</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="md:hidden space-y-3">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Effetto</p>
            <h4 className="mt-1 font-semibold text-slate-800">{effectTitle}</h4>
            {shortEffectDescription && (
              <p className="mt-2 text-sm text-slate-600">{shortEffectDescription}</p>
            )}
          </div>

          {fishboneBranches.map((branch) => {
            const causes = fishboneCausesByBranch[branch.id] || []

            return (
              <div key={branch.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-800">{branch.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {causes.length === 0 ? (
                    <span className="text-sm text-slate-400">Nessuna causa</span>
                  ) : (
                    causes.map(renderCausePill)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

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
                          (() => {
                            const linkedActions = fishboneCause.cause ? getActionsForCause(fishboneCause.cause.id) : []
                            const actionCountLabel = linkedActions.length === 1 ? '1 azione collegata' : `${linkedActions.length} azioni collegate`
                            const isCandidateRootCause = Boolean(fishboneCause.cause?.is_root_cause)
                            const existingFiveWhyChain = fishboneCause.cause ? getFiveWhyChainForCause(fishboneCause.cause.id) : undefined

                            return (
                          <div
                            key={fishboneCause.id}
                            className={`
                              rounded-lg px-3 py-2 border transition
                              ${isCandidateRootCause
                                ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-transparent hover:bg-gray-100'}
                            `}
                          >
                            <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="flex items-start gap-2 min-w-0">
                                  <span className="mt-0.5 text-xs font-medium text-gray-400 shrink-0">
                                    {causeIndex + 1}.
                                  </span>
                                  <p className="text-sm text-gray-700">
                                    {fishboneCause.cause?.description || 'Causa senza descrizione'}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 self-start">
                                  {isCandidateRootCause && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-medium">
                                      Candidata Root Cause
                                    </span>
                                  )}
                                  {!isCandidateRootCause && (
                                    <button
                                      type="button"
                                      onClick={() => toggleRootCause(fishboneCause)}
                                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-700 transition"
                                    >
                                      <Target className="w-3.5 h-3.5" />
                                      Segna candidata
                                    </button>
                                  )}
                                  {isCandidateRootCause && (
                                    <button
                                      type="button"
                                      onClick={() => fishboneCause.cause && startCreateAction(fishboneCause.cause.id)}
                                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-slate-300 text-slate-700 bg-white text-xs font-medium hover:bg-slate-50 transition"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      Crea azione
                                    </button>
                                  )}
                                </div>
                              </div>

                              {(linkedActions.length > 0 || isCandidateRootCause) && (
                                <div className="flex flex-wrap items-center gap-2 pl-5 text-xs">
                                  {linkedActions.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => changeTab('actions')}
                                      className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                    >
                                      {actionCountLabel}
                                    </button>
                                  )}
                                  {isCandidateRootCause && (
                                    <button
                                      type="button"
                                      onClick={() => fishboneCause.cause && createFiveWhyChainForCause(fishboneCause.cause)}
                                      disabled={fiveWhySaving}
                                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-sky-600 text-white hover:bg-sky-700 transition disabled:opacity-50"
                                    >
                                      <Plus className="w-3 h-3" />
                                      {existingFiveWhyChain ? 'Apri 5 Whys' : 'Avvia 5 Whys'}
                                    </button>
                                  )}
                                </div>
                              )}
                              </div>

                            {isCandidateRootCause && fishboneCause.cause && actionSuccessCauseId === fishboneCause.cause.id && (
                              <div className="mt-3 rounded-lg bg-green-50 text-green-700 px-3 py-2 text-sm">
                                Azione creata
                              </div>
                            )}

                            {isCandidateRootCause && fishboneCause.cause && activeActionFormCauseId === fishboneCause.cause.id && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  if (fishboneCause.cause) saveRCAAction(fishboneCause.cause)
                                }}
                                className="mt-3 rounded-lg border border-sky-100 bg-sky-50 p-3"
                              >
                                <label className="block text-sm font-medium text-sky-900 mb-2">
                                  Descrizione azione *
                                </label>
                                <textarea
                                  value={actionDescription}
                                  onChange={(e) => setActionDescription(e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-sky-200 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none resize-none"
                                  placeholder="Descrivi l'azione correttiva..."
                                  autoFocus
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                                  <div>
                                    <label className="block text-xs font-medium text-sky-900 mb-1">
                                      Responsabile
                                    </label>
                                    <input
                                      type="text"
                                      value={actionResponsible}
                                      onChange={(e) => setActionResponsible(e.target.value)}
                                      className="w-full px-3 py-2 border border-sky-200 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                                      placeholder="Nome"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-sky-900 mb-1">
                                      Data scadenza
                                    </label>
                                    <input
                                      type="date"
                                      value={actionDueDate}
                                      onChange={(e) => setActionDueDate(e.target.value)}
                                      className="w-full px-3 py-2 border border-sky-200 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-sky-900 mb-1">
                                      Priorita
                                    </label>
                                    <select
                                      value={actionPriority}
                                      onChange={(e) => setActionPriority(e.target.value as '' | 'low' | 'medium' | 'high' | 'critical')}
                                      className="w-full px-3 py-2 border border-sky-200 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                                    >
                                      <option value="">Non specificata</option>
                                      <option value="low">Low</option>
                                      <option value="medium">Medium</option>
                                      <option value="high">High</option>
                                      <option value="critical">Critical</option>
                                    </select>
                                  </div>
                                </div>

                                {actionError && (
                                  <div className="mt-3 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm">
                                    {actionError}
                                  </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-3">
                                  <button
                                    type="button"
                                    onClick={cancelCreateAction}
                                    className="px-3 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition"
                                  >
                                    Annulla
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={actionSaving}
                                    className="px-3 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition disabled:opacity-50"
                                  >
                                    {actionSaving ? 'Salvataggio...' : 'Salva'}
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                            )
                          })()
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

        {renderFishboneVisual()}
      </div>
    )
  }

  const renderFiveWhysTab = () => {
    if (fiveWhyLoading || fishboneLoading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento analisi 5 Whys...
        </div>
      )
    }

    const candidateCauses = getCandidateRootCauses()
    const handleCandidateFiveWhyToggle = (cause: RCACause) => {
      const existingChain = getFiveWhyChainForCause(cause.id)

      if (existingChain) {
        toggleFiveWhyChain(existingChain.id)
        return
      }

      createFiveWhyChainForCause(cause)
    }

    const renderExpandedChainPanel = (chain: RCAFiveWhyChain) => {
      const steps = fiveWhyStepsByChain[chain.id] || []
      const hasReachedFiveWhyLimit = steps.length >= FIVE_WHYS_MAX_STEPS
      const isExpanded = true

      return (
        <section key={chain.id} className="border-t border-sky-100 bg-white">
          <div className="hidden">
            <button
              type="button"
              onClick={() => toggleFiveWhyChain(chain.id)}
              aria-expanded={isExpanded}
              className="flex-1 text-left p-5 hover:bg-sky-50/50 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-sky-600 shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <h2 className="font-semibold text-gray-800 truncate">
                      {chain.cause?.description || chain.problem_statement || chain.title}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 ml-7">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      {chain.cause?.category || 'Categoria non specificata'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                      {chain.status === 'completed' ? 'Completato' : 'Bozza'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-medium">
                      {steps.length}/{FIVE_WHYS_MAX_STEPS} perché
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 lg:text-right lg:max-w-xs">
                  {isExpanded ? 'Chiudi analisi' : 'Apri analisi'}
                </p>
              </div>
            </button>

            <div className="flex items-start p-4 pl-0">
              <button
                type="button"
                onClick={() => deleteFiveWhyChain(chain.id)}
                aria-label="Elimina analisi 5 Whys"
                title="Elimina analisi"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isExpanded && (
          <div className="p-6 pt-5 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Sequenza dei perche</h3>
                <p className="text-sm text-gray-500">
                  {steps.length === 0
                    ? 'Nessun perche inserito.'
                    : `${steps.length} ${steps.length === 1 ? 'perche inserito' : 'perche inseriti'}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {hasReachedFiveWhyLimit ? (
                  <span className="inline-flex items-center px-3 py-2 rounded-lg bg-yellow-50 text-yellow-700 text-sm font-medium">
                    Limite di 5 perche raggiunto.
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => startAddFiveWhyStep(chain.id)}
                    disabled={fiveWhySaving}
                    className="inline-flex items-center gap-2 bg-white text-sky-700 border border-sky-200 px-4 py-2.5 rounded-lg font-medium hover:bg-sky-50 transition disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Aggiungi perche
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteFiveWhyChain(chain.id)}
                  aria-label="Elimina analisi 5 Whys"
                  title="Elimina analisi"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {steps.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-500">
                Aggiungi il primo perche per iniziare la catena di analisi.
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-sky-700 text-sm font-semibold shrink-0">
                          {step.step_number}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{step.why_question}</p>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{step.answer}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteFiveWhyStep(step)}
                        aria-label="Elimina step 5 Whys"
                        title="Elimina step"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeFiveWhyFormChainId === chain.id && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  saveFiveWhyStep(chain)
                }}
                className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-4"
              >
                <label className="block text-sm font-medium text-sky-900 mb-2">
                  Risposta al perche #{getNextFiveWhyStepNumber(chain.id)}
                </label>
                <textarea
                  value={newFiveWhyAnswer}
                  onChange={(e) => setNewFiveWhyAnswer(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-sky-200 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none resize-none"
                  placeholder="Descrivi la risposta..."
                  autoFocus
                />
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-3">
                  <button
                    type="button"
                    onClick={cancelAddFiveWhyStep}
                    className="px-3 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={fiveWhySaving}
                    className="px-3 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition disabled:opacity-50"
                  >
                    {fiveWhySaving ? 'Salvataggio...' : 'Salva'}
                  </button>
                </div>
              </form>
            )}
          </div>
          )}
        </section>
      )
    }

    return (
      <div className="space-y-8">
        {fiveWhyError && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {fiveWhyError}
          </div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Cause candidate disponibili</h2>
              <p className="text-sm text-gray-500">
                Una 5 Whys deve partire da una causa candidata identificata in Ishikawa.
              </p>
            </div>
          </div>

          {candidateCauses.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                Segna una causa candidata in Ishikawa per avviare una 5 Whys.
              </p>
              <button
                type="button"
                onClick={() => changeTab('ishikawa')}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition"
              >
                Vai a Ishikawa
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {candidateCauses.map((cause) => {
                const existingChain = getFiveWhyChainForCause(cause.id)
                const stepsCount = existingChain ? (fiveWhyStepsByChain[existingChain.id] || []).length : 0
                const isOpen = Boolean(existingChain && expandedFiveWhyChainId === existingChain.id)
                const chainProgressLabel = stepsCount === 0
                  ? 'Da compilare'
                  : stepsCount >= FIVE_WHYS_MAX_STEPS
                    ? 'Completa'
                    : 'In corso'
                const chainProgressClass = stepsCount === 0
                  ? 'bg-slate-100 text-slate-600'
                  : stepsCount >= FIVE_WHYS_MAX_STEPS
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                const actionLabel = !existingChain
                  ? 'Avvia 5 Whys'
                  : isOpen
                    ? 'Chiudi 5 Whys'
                    : 'Apri 5 Whys'

                return (
                  <div key={cause.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => handleCandidateFiveWhyToggle(cause)}
                      disabled={fiveWhySaving && !existingChain}
                      aria-expanded={isOpen}
                      className="w-full border-l-4 border-red-200 p-4 text-left hover:bg-slate-50 transition disabled:opacity-60"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-start gap-2">
                            {isOpen ? (
                              <ChevronDown className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                            )}
                            <p className="font-medium text-gray-800">{cause.description}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3 ml-7">
                            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-medium">
                              Causa candidata
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-white text-gray-600 border border-gray-100 text-xs font-medium">
                              {cause.category || 'Categoria non specificata'}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-medium">
                              {stepsCount}/{FIVE_WHYS_MAX_STEPS} perche
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${chainProgressClass}`}>
                              {chainProgressLabel}
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center justify-center gap-2 bg-white text-sky-700 border border-sky-200 px-4 py-2.5 rounded-lg font-medium">
                          {!existingChain && <Plus className="w-4 h-4" />}
                          {actionLabel}
                        </span>
                      </div>
                    </button>

                    {existingChain && isOpen && renderExpandedChainPanel(existingChain)}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    )
  }
  const renderCausesTab = () => {
    if (fishboneLoading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento cause RCA...
        </div>
      )
    }

    const allCauses = getAllAssessmentCauses()
    const filterOptions: { key: CauseFilter; label: string }[] = [
      { key: 'all', label: 'Tutte' },
      { key: 'candidates', label: 'Candidate' },
      { key: 'with_actions', label: 'Con azioni' },
      { key: 'without_actions', label: 'Senza azioni' },
    ]

    const filteredCauses = allCauses.filter((cause) => {
      const actionsCount = getActionsForCause(cause.id).length

      if (causeFilter === 'candidates') return cause.is_root_cause
      if (causeFilter === 'with_actions') return actionsCount > 0
      if (causeFilter === 'without_actions') return actionsCount === 0
      return true
    })

    return (
      <div className="space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Cause RCA</h2>
              <p className="text-sm text-gray-500 mt-1">
                Vista riepilogativa delle cause individuate nell'assessment.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setCauseFilter(option.key)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition
                    ${causeFilter === option.key
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200'}
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {allCauses.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-lg p-10 text-center">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Nessuna causa RCA registrata.</p>
              <button
                type="button"
                onClick={() => changeTab('ishikawa')}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition"
              >
                Vai a Ishikawa
              </button>
            </div>
          ) : filteredCauses.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-lg p-10 text-center text-gray-500">
              Nessuna causa corrisponde al filtro selezionato.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCauses.map((cause) => {
                const linkedActions = getActionsForCause(cause.id)
                const linkedActionsLabel = linkedActions.length === 1 ? '1 azione' : `${linkedActions.length} azioni`
                const fiveWhyChain = getFiveWhyChainForCause(cause.id)

                return (
                  <div key={cause.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800">{cause.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="px-2.5 py-1 rounded-full bg-white text-gray-600 border border-gray-100 text-xs font-medium">
                            {cause.category || 'Categoria non specificata'}
                          </span>
                          {cause.is_root_cause && (
                            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-medium">
                              Candidata Root Cause
                            </span>
                          )}
                          {linkedActions.length > 0 && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                              {linkedActionsLabel}
                            </span>
                          )}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            fiveWhyChain
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {fiveWhyChain ? '5 Whys presente' : '5 Whys assente'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() => changeTab('ishikawa')}
                          className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                        >
                          Vai a Ishikawa
                        </button>
                        {linkedActions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => changeTab('actions')}
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-sky-200 bg-white text-sky-700 text-sm font-medium hover:bg-sky-50 transition"
                          >
                            Vai ad Azioni
                          </button>
                        )}
                        {cause.is_root_cause && (
                          <button
                            type="button"
                            onClick={() => createFiveWhyChainForCause(cause)}
                            disabled={fiveWhySaving}
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition disabled:opacity-50"
                          >
                            {fiveWhyChain ? 'Apri 5 Whys' : 'Avvia 5 Whys'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    )
  }

  const renderActionsTab = () => {
    if (actionsLoading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Caricamento azioni RCA...
        </div>
      )
    }

    if (actionsError) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {actionsError}
          </div>
        </div>
      )
    }

    if (rcaActions.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Nessuna azione RCA</h2>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            Le azioni create dalle cause candidate appariranno qui.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {rcaActions.map((action) => (
          <div key={action.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800">{action.description}</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Responsabile: </span>
                    <span className="font-medium text-gray-700">{action.responsible || 'Non assegnato'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Scadenza: </span>
                    <span className="font-medium text-gray-700">{formatDate(action.due_date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Causa: </span>
                    <span className="font-medium text-gray-700">
                      {action.cause?.description || 'Non collegata'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Categoria: </span>
                    <span className="font-medium text-gray-700">
                      {action.cause?.category || 'N/D'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionStatusColor(action.status)}`}>
                  {getActionStatusLabel(action.status)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionPriorityColor(action.priority)}`}>
                  {getActionPriorityLabel(action.priority)}
                </span>
                {action.cause?.is_root_cause && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-200">
                    Candidata Root Cause
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => deleteRCAAction(action.id)}
                  aria-label="Elimina azione RCA"
                  title="Elimina azione"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
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
                onClick={() => changeTab(tab.key)}
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
        renderFiveWhysTab()
      ) : activeTab === 'causes' ? (
        renderCausesTab()
      ) : activeTab === 'actions' ? (
        renderActionsTab()
      ) : (
        renderPlaceholder(
          'Report',
          'Il report RCA riepiloghera evento, analisi, cause radice e azioni correttive.',
        )
      )}
    </div>
  )
}
