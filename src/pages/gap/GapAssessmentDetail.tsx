import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  BookMarked,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Percent,
  Plus,
  Save,
  Search,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  createGapActivity,
  createGapActivityEvaluationForAssessment,
  createGapArea,
  createGapStandard,
  getGapAssessmentById,
  getGapAssessmentProcessesWithStructure,
  getGapActivityStandardsForActivities,
  getGapActionsByAssessment,
  getGapEvaluationsByAssessment,
  getGapStandards,
  replaceGapActivityStandards,
  updateGapActivityEvaluation,
  updateGapAssessmentStats,
  type GapActivityStandardLinkInput,
  type GapStandardInput,
  type GapAreaWithActivities,
  type GapProcessWithStructure,
} from '../../services/gapService'
import { exportGapAssessmentToExcel, exportGapAssessmentToPDF } from '../../services/gapExportService'
import type {
  ComplianceStatus,
  GapAction,
  GapActivityStandard,
  GapActivityEvaluation,
  GapAssessment,
  GapStandard,
  RiskPriority,
} from '../../types/gap'
import { GapActionPlanTab } from '../../components/gap/GapActionPlanTab'
import { GapEvaluationRow } from '../../components/gap/GapEvaluationRow'
import { GapInlineActivityForm, type GapInlineActivityFormPayload } from '../../components/gap/GapInlineActivityForm'
import { GapInlineDomainForm, type GapInlineDomainFormPayload } from '../../components/gap/GapInlineDomainForm'
import { aggregateAssessmentStats } from '../../lib/gapScoring'
import {
  COMPLIANCE_STATUS_OPTIONS,
  RISK_PRIORITY_OPTIONS,
  getComplianceStatusColor,
  getComplianceStatusLabel,
  getGapAssessmentStatusColor,
  getGapAssessmentStatusLabel,
  getGapRiskPriorityColor,
  getGapRiskPriorityLabel,
} from '../../lib/labels'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'

interface EvaluationDraft {
  current_state: string
  target_state_override: string
  gap_description: string
  compliance_status: ComplianceStatus
  risk_priority: RiskPriority
  notes: string
}

interface AreaGroup {
  areaName: string
  evaluations: GapActivityEvaluation[]
}

interface ProcessGroup {
  processName: string
  areas: AreaGroup[]
}

interface StandardDraftLink {
  standard_id: string
  specific_reference: string
}

interface StandardFormState {
  code: string
  name: string
  version: string
  issuing_body: string
  description: string
  url: string
}

type StandardsByActivityId = Record<string, GapActivityStandard[]>

type DetailTab = 'evaluation' | 'findings' | 'actions'
type ActionCreateRequest = { evaluationId: string; requestId: number }
type EvaluationQuickFilter = 'all' | 'not_evaluated' | 'with_gap' | 'high_priority' | 'non_compliant'
type FindingComplianceFilter = 'all' | 'non_compliant' | 'partially_compliant'
type FindingPriorityFilter = 'all' | RiskPriority

const findingStatuses: ComplianceStatus[] = ['non_compliant', 'partially_compliant']

const emptyStandardForm: StandardFormState = {
  code: '',
  name: '',
  version: '',
  issuing_body: '',
  description: '',
  url: '',
}

const evaluationQuickFilters: Array<{ value: EvaluationQuickFilter; label: string }> = [
  { value: 'all', label: 'Tutte' },
  { value: 'not_evaluated', label: 'Da valutare' },
  { value: 'with_gap', label: 'Con gap' },
  { value: 'high_priority', label: 'Alta priorita' },
  { value: 'non_compliant', label: 'Non conformi' },
]

const priorityOrder: Record<RiskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

const complianceOrder: Partial<Record<ComplianceStatus, number>> = {
  non_compliant: 0,
  partially_compliant: 1,
}

const toNullable = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const toEvaluationDraft = (evaluation: GapActivityEvaluation): EvaluationDraft => ({
  current_state: evaluation.current_state || '',
  target_state_override: evaluation.target_state_override || '',
  gap_description: evaluation.gap_description || '',
  compliance_status: evaluation.compliance_status,
  risk_priority: evaluation.risk_priority,
  notes: evaluation.notes || '',
})

const formatDate = (value: string | null) => {
  return value ? new Date(value).toLocaleDateString('it-IT') : 'N/D'
}

const hasDraftChanges = (evaluation: GapActivityEvaluation, draft: EvaluationDraft | undefined) => {
  if (!draft) return false

  return (
    draft.current_state !== (evaluation.current_state || '') ||
    draft.target_state_override !== (evaluation.target_state_override || '') ||
    draft.gap_description !== (evaluation.gap_description || '') ||
    draft.compliance_status !== evaluation.compliance_status ||
    draft.risk_priority !== evaluation.risk_priority ||
    draft.notes !== (evaluation.notes || '')
  )
}

const groupEvaluations = (evaluations: GapActivityEvaluation[]): ProcessGroup[] => {
  const processMap = new Map<string, Map<string, GapActivityEvaluation[]>>()

  evaluations.forEach((evaluation) => {
    const processName = evaluation.process_name_snapshot || 'Processo non specificato'
    const areaName = evaluation.area_name_snapshot || 'Dominio/Sezione non specificato'
    const areaMap = processMap.get(processName) || new Map<string, GapActivityEvaluation[]>()
    const areaEvaluations = areaMap.get(areaName) || []

    areaMap.set(areaName, [...areaEvaluations, evaluation])
    processMap.set(processName, areaMap)
  })

  return Array.from(processMap.entries()).map(([processName, areaMap]) => ({
    processName,
    areas: Array.from(areaMap.entries()).map(([areaName, areaEvaluations]) => ({
      areaName,
      evaluations: areaEvaluations,
    })),
  }))
}

const groupStandardsByActivity = (links: GapActivityStandard[]): StandardsByActivityId => {
  return links.reduce<StandardsByActivityId>((acc, link) => ({
    ...acc,
    [link.activity_id]: [...(acc[link.activity_id] || []), link],
  }), {})
}

export default function GapAssessmentDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [assessment, setAssessment] = useState<GapAssessment | null>(null)
  const [evaluations, setEvaluations] = useState<GapActivityEvaluation[]>([])
  const [assessmentProcesses, setAssessmentProcesses] = useState<GapProcessWithStructure[]>([])
  const [gapActions, setGapActions] = useState<GapAction[]>([])
  const [standards, setStandards] = useState<GapStandard[]>([])
  const [standardsByActivityId, setStandardsByActivityId] = useState<StandardsByActivityId>({})
  const [drafts, setDrafts] = useState<Record<string, EvaluationDraft>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingEvaluationId, setSavingEvaluationId] = useState<string | null>(null)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [activeTab, setActiveTab] = useState<DetailTab>('evaluation')
  const [actionCreateRequest, setActionCreateRequest] = useState<ActionCreateRequest | null>(null)
  const [evaluationQuickFilter, setEvaluationQuickFilter] = useState<EvaluationQuickFilter>('all')
  const [findingComplianceFilter, setFindingComplianceFilter] = useState<FindingComplianceFilter>('all')
  const [findingPriorityFilter, setFindingPriorityFilter] = useState<FindingPriorityFilter>('all')
  const [findingProcessFilter, setFindingProcessFilter] = useState('all')
  const [findingSearch, setFindingSearch] = useState('')
  const [expandedEvaluationId, setExpandedEvaluationId] = useState<string | null>(null)
  const [showDomainForm, setShowDomainForm] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [selectedProcessForDomain, setSelectedProcessForDomain] = useState('')
  const [selectedProcessForActivity, setSelectedProcessForActivity] = useState('')
  const [selectedAreaForActivity, setSelectedAreaForActivity] = useState('')
  const [savingDomain, setSavingDomain] = useState(false)
  const [savingActivity, setSavingActivity] = useState(false)
  const [editingStandardsEvaluationId, setEditingStandardsEvaluationId] = useState<string | null>(null)
  const [standardDraftLinks, setStandardDraftLinks] = useState<StandardDraftLink[]>([])
  const [savingStandards, setSavingStandards] = useState(false)
  const [showCreateStandardForm, setShowCreateStandardForm] = useState(false)
  const [newStandardForm, setNewStandardForm] = useState<StandardFormState>(emptyStandardForm)
  const [savingNewStandard, setSavingNewStandard] = useState(false)

  useEffect(() => {
    if (!id || !user?.id) return

    let active = true

    const fetchAssessment = async () => {
      setLoading(true)
      setError(null)

      try {
        const [assessmentData, evaluationData, actionsData, processData, standardsData] = await Promise.all([
          getGapAssessmentById(id, user.id),
          getGapEvaluationsByAssessment(id, user.id),
          getGapActionsByAssessment(id, user.id),
          getGapAssessmentProcessesWithStructure(id, user.id),
          getGapStandards(user.id),
        ])

        if (!active) return

        setAssessment(assessmentData)
        setEvaluations(evaluationData)
        setAssessmentProcesses(processData)
        setSelectedProcessForDomain(processData[0]?.id || '')
        setSelectedProcessForActivity(processData[0]?.id || '')
        setSelectedAreaForActivity(processData[0]?.areas[0]?.id || '')
        setGapActions(actionsData)
        setStandards(standardsData)
        setStandardsByActivityId({})
        setEditingStandardsEvaluationId(null)
        setStandardDraftLinks([])
        setShowCreateStandardForm(false)
        setNewStandardForm(emptyStandardForm)
        setDrafts(
          evaluationData.reduce<Record<string, EvaluationDraft>>((acc, evaluation) => ({
            ...acc,
            [evaluation.id]: toEvaluationDraft(evaluation),
          }), {}),
        )

        try {
          const activityIds = evaluationData.map((evaluation) => evaluation.activity_id)
          const standardLinks = await getGapActivityStandardsForActivities(activityIds, user.id)
          if (active) setStandardsByActivityId(groupStandardsByActivity(standardLinks))
        } catch (standardsError) {
          console.error('Errore caricamento riferimenti normativi Gap:', standardsError)
          if (active) {
            setError('Assessment caricato, ma non e stato possibile caricare alcuni riferimenti normativi.')
          }
        }
      } catch (fetchError) {
        console.error('Errore caricamento assessment Gap:', fetchError)
        if (active) setError('Impossibile caricare il dettaglio assessment Gap.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchAssessment()

    return () => {
      active = false
    }
  }, [id, user?.id])

  const stats = useMemo(() => aggregateAssessmentStats(evaluations), [evaluations])
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((evaluation) => {
      switch (evaluationQuickFilter) {
        case 'not_evaluated':
          return evaluation.compliance_status === 'not_evaluated'
        case 'non_compliant':
          return evaluation.compliance_status === 'non_compliant'
        case 'high_priority':
          return evaluation.risk_priority === 'high'
        case 'with_gap':
          return Boolean(evaluation.gap_description?.trim())
        case 'all':
        default:
          return true
      }
    })
  }, [evaluationQuickFilter, evaluations])
  const groupedEvaluations = useMemo(() => groupEvaluations(filteredEvaluations), [filteredEvaluations])
  const gapFindings = useMemo(() => {
    return evaluations
      .filter((evaluation) => findingStatuses.includes(evaluation.compliance_status))
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.risk_priority] - priorityOrder[b.risk_priority]
        if (priorityDiff !== 0) return priorityDiff

        const complianceDiff = (complianceOrder[a.compliance_status] ?? 99) - (complianceOrder[b.compliance_status] ?? 99)
        if (complianceDiff !== 0) return complianceDiff

        return (a.activity_code_snapshot || '').localeCompare(b.activity_code_snapshot || '')
      })
  }, [evaluations])
  const findingProcesses = useMemo(() => {
    return Array.from(new Set(
      gapFindings.map((evaluation) => evaluation.process_name_snapshot || 'Processo non specificato'),
    )).sort((a, b) => a.localeCompare(b))
  }, [gapFindings])
  const filteredGapFindings = useMemo(() => {
    const normalizedSearch = findingSearch.trim().toLowerCase()

    return gapFindings.filter((evaluation) => {
      const processName = evaluation.process_name_snapshot || 'Processo non specificato'
      const matchesCompliance = findingComplianceFilter === 'all' || evaluation.compliance_status === findingComplianceFilter
      const matchesPriority = findingPriorityFilter === 'all' || evaluation.risk_priority === findingPriorityFilter
      const matchesProcess = findingProcessFilter === 'all' || processName === findingProcessFilter
      const searchableText = [
        evaluation.activity_code_snapshot,
        evaluation.activity_name_snapshot,
        evaluation.gap_description,
        evaluation.current_state,
        evaluation.target_state_override,
        evaluation.notes,
      ].filter(Boolean).join(' ').toLowerCase()

      return (
        matchesCompliance &&
        matchesPriority &&
        matchesProcess &&
        (normalizedSearch.length === 0 || searchableText.includes(normalizedSearch))
      )
    })
  }, [
    findingComplianceFilter,
    findingPriorityFilter,
    findingProcessFilter,
    findingSearch,
    gapFindings,
  ])
  const actionCountByEvaluationId = useMemo(() => {
    return gapActions.reduce<Record<string, number>>((acc, action) => ({
      ...acc,
      [action.evaluation_id]: (acc[action.evaluation_id] || 0) + 1,
    }), {})
  }, [gapActions])
  const selectedActivityProcess = useMemo(() => {
    return assessmentProcesses.find((process) => process.id === selectedProcessForActivity) || null
  }, [assessmentProcesses, selectedProcessForActivity])
  const selectedActivityArea = useMemo(() => {
    return selectedActivityProcess?.areas.find((area) => area.id === selectedAreaForActivity) || null
  }, [selectedAreaForActivity, selectedActivityProcess])
  const targetStateByActivityId = useMemo(() => {
    return assessmentProcesses.reduce<Record<string, string | null>>((acc, process) => {
      process.areas.forEach((area) => {
        area.activities.forEach((activity) => {
          acc[activity.id] = activity.target_state || null
        })
      })

      return acc
    }, {})
  }, [assessmentProcesses])

  const updateDraft = (
    evaluationId: string,
    patch: Partial<EvaluationDraft>,
  ) => {
    setDrafts((current) => ({
      ...current,
      [evaluationId]: {
        ...current[evaluationId],
        ...patch,
      },
    }))
  }

  const resetDraft = (evaluation: GapActivityEvaluation) => {
    setDrafts((current) => ({
      ...current,
      [evaluation.id]: toEvaluationDraft(evaluation),
    }))
  }

  const resetStandardEditor = () => {
    setEditingStandardsEvaluationId(null)
    setStandardDraftLinks([])
    setShowCreateStandardForm(false)
    setNewStandardForm(emptyStandardForm)
    setError(null)
  }

  const startEditStandards = (evaluation: GapActivityEvaluation) => {
    const existingLinks = standardsByActivityId[evaluation.activity_id] || []

    setExpandedEvaluationId(evaluation.id)
    setEditingStandardsEvaluationId(evaluation.id)
    setStandardDraftLinks(
      existingLinks.map((link) => ({
        standard_id: link.standard_id,
        specific_reference: link.specific_reference || '',
      })),
    )
    setShowCreateStandardForm(false)
    setNewStandardForm(emptyStandardForm)
    setError(null)
  }

  const toggleStandardDraftLink = (standardId: string) => {
    setStandardDraftLinks((current) => {
      if (current.some((link) => link.standard_id === standardId)) {
        return current.filter((link) => link.standard_id !== standardId)
      }

      return [...current, { standard_id: standardId, specific_reference: '' }]
    })
  }

  const updateStandardDraftReference = (standardId: string, specificReference: string) => {
    setStandardDraftLinks((current) =>
      current.map((link) =>
        link.standard_id === standardId
          ? { ...link, specific_reference: specificReference }
          : link,
      ),
    )
  }

  const saveEvaluationActivityStandards = async (evaluation: GapActivityEvaluation) => {
    if (!user?.id) return

    setSavingStandards(true)
    setError(null)

    try {
      const payload: GapActivityStandardLinkInput[] = standardDraftLinks.map((link) => ({
        standard_id: link.standard_id,
        specific_reference: toNullable(link.specific_reference),
      }))
      const updatedLinks = await replaceGapActivityStandards(evaluation.activity_id, user.id, payload)

      setStandardsByActivityId((current) => ({
        ...current,
        [evaluation.activity_id]: updatedLinks,
      }))
      resetStandardEditor()
    } catch (saveError) {
      console.error('Errore salvataggio norme Attivita/Requisito:', saveError)
      setError('Impossibile salvare le norme collegate all Attivita/Requisito.')
    } finally {
      setSavingStandards(false)
    }
  }

  const createStandardAndLinkToActivity = async (evaluation: GapActivityEvaluation) => {
    if (!user?.id) return

    const code = newStandardForm.code.trim()
    const name = newStandardForm.name.trim()

    if (!code || !name) {
      setError('Codice e nome della norma sono obbligatori.')
      return
    }

    setSavingNewStandard(true)
    setError(null)

    try {
      const payload: GapStandardInput = {
        code,
        name,
        version: toNullable(newStandardForm.version),
        issuing_body: toNullable(newStandardForm.issuing_body),
        description: toNullable(newStandardForm.description),
        url: toNullable(newStandardForm.url),
      }
      const createdStandard = await createGapStandard(user.id, payload)
      const nextDraftLinks = [
        ...standardDraftLinks.filter((link) => link.standard_id !== createdStandard.id),
        { standard_id: createdStandard.id, specific_reference: '' },
      ]
      const updatedLinks = await replaceGapActivityStandards(
        evaluation.activity_id,
        user.id,
        nextDraftLinks.map((link) => ({
          standard_id: link.standard_id,
          specific_reference: toNullable(link.specific_reference),
        })),
      )

      setStandards((current) => [...current, createdStandard].sort((a, b) =>
        a.code.localeCompare(b.code) || a.name.localeCompare(b.name),
      ))
      setStandardDraftLinks(
        updatedLinks.map((link) => ({
          standard_id: link.standard_id,
          specific_reference: link.specific_reference || '',
        })),
      )
      setStandardsByActivityId((current) => ({
        ...current,
        [evaluation.activity_id]: updatedLinks,
      }))
      resetStandardEditor()
    } catch (createError) {
      console.error('Errore creazione norma da assessment Gap:', createError)
      setError('Impossibile creare e collegare la nuova norma. Verifica i dati e riprova.')
    } finally {
      setSavingNewStandard(false)
    }
  }

  const getNextOrderIndex = (items: Array<{ order_index: number }>) => {
    return items.length > 0
      ? Math.max(...items.map((item) => item.order_index || 0)) + 1
      : 1
  }

  const getNextActivityCode = (area: GapAreaWithActivities | null) => {
    if (!area) return null

    const prefix = `${area.code}-`
    const maxSuffix = area.activities.reduce((max, activity) => {
      if (!activity.code.startsWith(prefix)) return max

      const suffix = activity.code.slice(prefix.length)
      const numericSuffix = /^\d+$/.test(suffix) ? Number(suffix) : 0
      return Math.max(max, numericSuffix)
    }, 0)

    if (maxSuffix >= 99) return null
    return `${prefix}${String(maxSuffix + 1).padStart(2, '0')}`
  }

  const addDomainToAssessmentProcess = async (payload: GapInlineDomainFormPayload) => {
    if (!user?.id || !selectedProcessForDomain) return

    const process = assessmentProcesses.find((item) => item.id === selectedProcessForDomain)
    if (!process) return

    if (!payload.code || !payload.name) {
      setError('Codice e nome del Dominio/Sezione sono obbligatori.')
      return
    }

    setSavingDomain(true)
    setError(null)

    try {
      const area = await createGapArea(user.id, process.id, {
        code: payload.code,
        name: payload.name,
        description: toNullable(payload.description),
        order_index: getNextOrderIndex(process.areas),
      })
      const areaWithActivities: GapAreaWithActivities = { ...area, activities: [] }

      setAssessmentProcesses((current) => current.map((item) => (
        item.id === process.id
          ? {
              ...item,
              areas: [...item.areas, areaWithActivities].sort((a, b) =>
                (a.order_index - b.order_index) || a.name.localeCompare(b.name),
              ),
            }
          : item
      )))
      setSelectedProcessForActivity(process.id)
      setSelectedAreaForActivity(area.id)
      setShowDomainForm(false)
    } catch (createError) {
      console.error('Errore creazione Dominio/Sezione Gap:', createError)
      setError('Impossibile creare il Dominio/Sezione nella libreria Gap.')
    } finally {
      setSavingDomain(false)
    }
  }

  const addActivityToAssessment = async (payload: GapInlineActivityFormPayload) => {
    if (!user?.id || !assessment || !selectedActivityProcess || !selectedActivityArea) return

    if (!payload.name) {
      setError('Il nome dell Attivita/Requisito e obbligatorio.')
      return
    }

    const generatedCode = getNextActivityCode(selectedActivityArea)
    if (!generatedCode) {
      setError('Non si possono inserire piu di 99 Attivita/Requisiti per Dominio/Sezione. Procedi con la creazione di un nuovo Dominio/Sezione.')
      return
    }

    setSavingActivity(true)
    setError(null)

    try {
      const activity = await createGapActivity(user.id, selectedActivityArea.id, {
        code: generatedCode,
        name: payload.name,
        description: toNullable(payload.description),
        operator: toNullable(payload.operator),
        target_state: toNullable(payload.target_state),
        order_index: getNextOrderIndex(selectedActivityArea.activities),
      })

      const evaluation = await createGapActivityEvaluationForAssessment(user.id, assessment.id, {
        activity_id: activity.id,
        process_name_snapshot: selectedActivityProcess.name,
        area_name_snapshot: selectedActivityArea.name,
        activity_name_snapshot: activity.name,
        activity_code_snapshot: activity.code,
      })
      const nextEvaluations = [...evaluations, evaluation]
      const nextStats = aggregateAssessmentStats(nextEvaluations)
      const updatedAssessment = await updateGapAssessmentStats(assessment.id, user.id, nextStats)

      setAssessmentProcesses((current) => current.map((process) => (
        process.id === selectedActivityProcess.id
          ? {
              ...process,
              areas: process.areas.map((area) => (
                area.id === selectedActivityArea.id
                  ? {
                      ...area,
                      activities: [...area.activities, activity].sort((a, b) =>
                        (a.order_index - b.order_index) || a.name.localeCompare(b.name),
                      ),
                    }
                  : area
              )),
              total_activities: process.total_activities + 1,
            }
          : process
      )))
      setEvaluations(nextEvaluations)
      setDrafts((current) => ({
        ...current,
        [evaluation.id]: toEvaluationDraft(evaluation),
      }))
      setAssessment(updatedAssessment)
      setExpandedEvaluationId(evaluation.id)
      setShowActivityForm(false)
    } catch (createError) {
      console.error('Errore creazione Attivita/Requisito Gap:', createError)
      setError('Impossibile creare l Attivita/Requisito nell assessment Gap.')
    } finally {
      setSavingActivity(false)
    }
  }

  const saveEvaluation = async (evaluation: GapActivityEvaluation) => {
    if (!user?.id || !assessment) return

    const draft = drafts[evaluation.id]
    if (!draft) return

    setSavingEvaluationId(evaluation.id)
    setError(null)

    try {
      const updatedEvaluation = await updateGapActivityEvaluation(evaluation.id, user.id, {
        current_state: toNullable(draft.current_state),
        target_state_override: toNullable(draft.target_state_override),
        gap_description: toNullable(draft.gap_description),
        compliance_status: draft.compliance_status,
        risk_priority: draft.risk_priority,
        notes: toNullable(draft.notes),
        evaluated_by: user.email || null,
        evaluated_at: new Date().toISOString(),
      })

      const nextEvaluations = evaluations.map((item) =>
        item.id === updatedEvaluation.id ? updatedEvaluation : item,
      )
      const nextStats = aggregateAssessmentStats(nextEvaluations)

      setEvaluations(nextEvaluations)
      setDrafts((current) => ({
        ...current,
        [updatedEvaluation.id]: toEvaluationDraft(updatedEvaluation),
      }))

      try {
        const updatedAssessment = await updateGapAssessmentStats(
          assessment.id,
          user.id,
          nextStats,
        )
        setAssessment(updatedAssessment)
      } catch (statsError) {
        console.error('Errore aggiornamento indicatori assessment Gap:', statsError)
        setError(
          'Valutazione salvata, ma gli indicatori dell assessment non sono stati aggiornati. Ricarica la pagina o riprova il salvataggio.',
        )
      }
    } catch (saveError) {
      console.error('Errore salvataggio evaluation Gap:', saveError)
      setError('Impossibile salvare la valutazione. Verifica i dati e riprova.')
    } finally {
      setSavingEvaluationId(null)
    }
  }

  const handleExportExcel = () => {
    if (!assessment) return

    setExportingExcel(true)
    setError(null)

    try {
      exportGapAssessmentToExcel({
        assessment,
        evaluations,
        actions: gapActions,
        standardsByActivityId,
        targetStateByActivityId,
      })
    } catch (exportError) {
      console.error('Errore export Excel Gap:', exportError)
      setError('Impossibile esportare il file Excel Gap. Riprova tra qualche istante.')
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportPDF = () => {
    if (!assessment) return

    setExportingPDF(true)
    setError(null)

    try {
      exportGapAssessmentToPDF({
        assessment,
        evaluations,
        actions: gapActions,
        standardsByActivityId,
        targetStateByActivityId,
      })
    } catch (exportError) {
      console.error('Errore export PDF Gap:', exportError)
      setError('Impossibile esportare il file PDF Gap. Riprova tra qualche istante.')
    } finally {
      setExportingPDF(false)
    }
  }

  const openActionFormForEvaluation = (evaluation: GapActivityEvaluation) => {
    if (!findingStatuses.includes(evaluation.compliance_status)) {
      setError('Le azioni correttive possono essere create solo da valutazioni non conformi o parzialmente conformi.')
      return
    }

    setError(null)
    setActiveTab('actions')
    setExpandedEvaluationId(null)
    setActionCreateRequest((current) => ({
      evaluationId: evaluation.id,
      requestId: (current?.requestId || 0) + 1,
    }))
  }

  const renderAssessmentEnrichment = () => (
    <div className="sticky top-0 z-30 -mx-1 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Arricchisci assessment</p>
          <p className="hidden text-xs text-slate-500 md:block">
            Aggiungi elementi alla libreria personale.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            className="w-full sm:w-auto"
            onClick={() => {
              setShowDomainForm((current) => !current)
              setShowActivityForm(false)
            }}
          >
            Aggiungi Dominio/Sezione
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            className="w-full sm:w-auto"
            onClick={() => {
              setShowActivityForm((current) => !current)
              setShowDomainForm(false)
            }}
          >
            Aggiungi Attivita/Requisito
          </Button>
        </div>
      </div>

      {(showDomainForm || showActivityForm) && (
        <div className="mt-3 max-h-[68vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/95 p-3 shadow-inner">
          {showDomainForm && (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Processo</span>
                <select
                  value={selectedProcessForDomain}
                  onChange={(event) => setSelectedProcessForDomain(event.target.value)}
                  className="clinical-input bg-white"
                >
                  {assessmentProcesses.map((process) => (
                    <option key={process.id} value={process.id}>
                      {process.code} - {process.name}
                    </option>
                  ))}
                </select>
              </label>
              <GapInlineDomainForm
                loading={savingDomain}
                onCancel={() => setShowDomainForm(false)}
                onSubmit={addDomainToAssessmentProcess}
              />
            </div>
          )}

          {showActivityForm && (
            <div className="space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Processo</span>
                  <select
                    value={selectedProcessForActivity}
                    onChange={(event) => {
                      const nextProcessId = event.target.value
                      const nextProcess = assessmentProcesses.find((process) => process.id === nextProcessId)
                      setSelectedProcessForActivity(nextProcessId)
                      setSelectedAreaForActivity(nextProcess?.areas[0]?.id || '')
                    }}
                    className="clinical-input bg-white"
                  >
                    {assessmentProcesses.map((process) => (
                      <option key={process.id} value={process.id}>
                        {process.code} - {process.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Dominio/Sezione</span>
                  <select
                    value={selectedAreaForActivity}
                    onChange={(event) => setSelectedAreaForActivity(event.target.value)}
                    className="clinical-input bg-white"
                  >
                    {selectedActivityProcess?.areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.code} - {area.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {!selectedActivityArea ? (
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
                  Crea prima un Dominio/Sezione nel processo selezionato.
                </div>
              ) : (
                <GapInlineActivityForm
                  generatedCode={getNextActivityCode(selectedActivityArea)}
                  limitReached={!getNextActivityCode(selectedActivityArea)}
                  loading={savingActivity}
                  onCancel={() => setShowActivityForm(false)}
                  onSubmit={addActivityToAssessment}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderNormativeReferences = (evaluation: GapActivityEvaluation) => {
    const links = standardsByActivityId[evaluation.activity_id] || []

    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="mb-3 flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-teal-700" />
          <h4 className="text-sm font-semibold text-slate-900">Riferimenti normativi</h4>
        </div>

        {links.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nessun riferimento normativo collegato all'Attivita/Requisito.
          </p>
        ) : (
          <div className="grid gap-3">
            {links.map((link) => {
              const standard = link.standard

              return (
                <div key={link.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
                          {standard?.code || 'Norma'}
                        </span>
                        {standard?.version && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            Versione {standard.version}
                          </span>
                        )}
                        {standard?.issuing_body && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {standard.issuing_body}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {standard?.name || 'Norma non disponibile'}
                      </p>
                      {link.specific_reference && (
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Riferimento specifico: {link.specific_reference}
                        </p>
                      )}
                    </div>

                    {standard?.url && (
                      <a
                        href={standard.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-teal-700 transition hover:text-teal-800"
                      >
                        Apri link
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="clinical-page">
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            Caricamento assessment Gap...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="clinical-page">
        <PageHeader
          title="Assessment Gap non trovato"
          description="L assessment richiesto non esiste oppure non e accessibile con l utente corrente."
          eyebrow="Gap Analysis"
          icon={<ClipboardList className="h-6 w-6" />}
          backAction={(
            <Link to="/gap/assessments" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800">
              <ArrowLeft className="h-4 w-4" />
              Torna agli assessment
            </Link>
          )}
        />
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Assessment non disponibile"
          description="Controlla la lista degli assessment Gap e riprova."
        />
      </div>
    )
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title={assessment.title}
        description={assessment.description || 'Valuta conformita, gap e priorita per ogni Attivita/Requisito selezionato.'}
        eyebrow="Gap Analysis"
        icon={<ClipboardList className="h-6 w-6" />}
        backAction={(
          <Link to="/gap/assessments" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800">
            <ArrowLeft className="h-4 w-4" />
            Torna agli assessment
          </Link>
        )}
        actions={(
          <>
            <button
              type="button"
              disabled={exportingPDF}
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportingPDF ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Esporta PDF
            </button>
            <button
              type="button"
              disabled={exportingExcel}
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportingExcel ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Esporta Excel
            </button>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${getGapAssessmentStatusColor(assessment.status)}`}>
              {getGapAssessmentStatusLabel(assessment.status)}
            </span>
          </>
        )}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Struttura</p>
              <p className="mt-1 font-medium text-slate-800">{assessment.facility_name || 'N/D'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reparto / Unita</p>
              <p className="mt-1 font-medium text-slate-800">{assessment.department || 'N/D'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assessor</p>
              <p className="mt-1 font-medium text-slate-800">{assessment.assessor || 'N/D'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Data assessment</p>
              <p className="mt-1 font-medium text-slate-800">{formatDate(assessment.assessment_date)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard
          label="Attivita/Requisiti"
          value={stats.total_activities}
          icon={<FileText className="h-6 w-6" />}
          tone="clinical"
        />
        <StatCard
          label="Compliance"
          value={`${stats.compliance_percentage}%`}
          icon={<Percent className="h-6 w-6" />}
          tone="success"
        />
        <StatCard
          label="Conformi"
          value={stats.compliant_count}
          icon={<CheckCircle2 className="h-6 w-6" />}
          tone="success"
        />
        <StatCard
          label="Parziali"
          value={stats.partial_count}
          icon={<CircleDashed className="h-6 w-6" />}
          tone="neutral"
        />
        <StatCard
          label="Non conformi"
          value={stats.non_compliant_count}
          icon={<AlertTriangle className="h-6 w-6" />}
          tone="risk"
        />
        <StatCard
          label="Non valutate"
          value={stats.not_evaluated_count}
          icon={<ClipboardList className="h-6 w-6" />}
          tone="neutral"
        />
        <StatCard
          label="N.A."
          value={stats.na_count}
          icon={<CircleDashed className="h-6 w-6" />}
          tone="neutral"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('evaluation')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'evaluation'
              ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          Valutazione
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('findings')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'findings'
              ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          Gap Findings
          <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs">
            {gapFindings.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'actions'
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          Azioni correttive
          <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs">
            {gapActions.length}
          </span>
        </button>
      </div>

      {activeTab === 'evaluation' && (evaluations.length === 0 ? (
        <div className="space-y-6">
          {renderAssessmentEnrichment()}

          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title="Nessuna valutazione disponibile"
            description="Questo assessment non contiene ancora Attivita/Requisiti da valutare."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {renderAssessmentEnrichment()}

          <Card className="border-teal-100 bg-teal-50/40">
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Clicca su un'Attivita/Requisito per compilare o aggiornare la valutazione.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Gerarchia: Processo {'->'} Dominio/Sezione {'->'} Contesto operativo {'->'} Attivita/Requisito.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {evaluationQuickFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setEvaluationQuickFilter(filter.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      evaluationQuickFilter === filter.value
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {filteredEvaluations.length === 0 ? (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="Nessuna Attivita/Requisito corrisponde al filtro"
              description="Seleziona un filtro diverso per visualizzare altre valutazioni."
            />
          ) : groupedEvaluations.map((processGroup) => (
            <Card key={processGroup.processName}>
              <CardHeader>
                <CardTitle>{processGroup.processName}</CardTitle>
                <CardDescription>
                  Valutazioni organizzate per Dominio/Sezione e Attivita/Requisito.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {processGroup.areas.map((areaGroup) => (
                  <section key={`${processGroup.processName}-${areaGroup.areaName}`} className="space-y-4">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        {areaGroup.areaName}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {areaGroup.evaluations.length} Attivita/Requisiti
                      </span>
                    </div>

                    <div className="grid gap-4">
                      <div className="hidden rounded-lg border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 xl:grid xl:grid-cols-[0.9fr_1.1fr_1fr_0.8fr_0.8fr_0.7fr_0.7fr_1fr_auto] xl:items-center">
                        <span>Codice</span>
                        <span>Attivita/Requisito</span>
                        <span>Dominio/Sezione</span>
                        <span>Conformita</span>
                        <span>Priorita</span>
                        <span>Azioni</span>
                        <span>Norme</span>
                        <span>Ultima valutazione</span>
                        <span className="sr-only">Apri</span>
                      </div>
                      {areaGroup.evaluations.map((evaluation) => {
                        const draft = drafts[evaluation.id]
                        const changed = hasDraftChanges(evaluation, draft)
                        const saving = savingEvaluationId === evaluation.id

                        return (
                          <GapEvaluationRow
                            key={evaluation.id}
                            evaluation={evaluation}
                            draft={draft}
                            expanded={expandedEvaluationId === evaluation.id}
                            changed={changed}
                            saving={saving}
                            actionCount={actionCountByEvaluationId[evaluation.id] || 0}
                            standards={standardsByActivityId[evaluation.activity_id] || []}
                            targetState={targetStateByActivityId[evaluation.activity_id] || null}
                            standardsCatalog={standards}
                            standardsEditorOpen={editingStandardsEvaluationId === evaluation.id}
                            standardDraftLinks={standardDraftLinks}
                            savingStandards={savingStandards}
                            showCreateStandardForm={showCreateStandardForm}
                            newStandardForm={newStandardForm}
                            savingNewStandard={savingNewStandard}
                            savingDisabled={savingEvaluationId !== null}
                            onToggle={() => {
                              resetStandardEditor()
                              setExpandedEvaluationId((current) => (
                                current === evaluation.id ? null : evaluation.id
                              ))
                            }}
                            onManageStandards={() => (
                              editingStandardsEvaluationId === evaluation.id
                                ? resetStandardEditor()
                                : startEditStandards(evaluation)
                            )}
                            onCancelStandards={resetStandardEditor}
                            onToggleStandard={toggleStandardDraftLink}
                            onUpdateStandardReference={updateStandardDraftReference}
                            onToggleCreateStandard={() => setShowCreateStandardForm((current) => !current)}
                            onNewStandardFormChange={(patch) => setNewStandardForm((current) => ({ ...current, ...patch }))}
                            onDraftChange={(patch) => updateDraft(evaluation.id, patch)}
                            onReset={() => resetDraft(evaluation)}
                            onSaveStandards={() => saveEvaluationActivityStandards(evaluation)}
                            onCreateStandard={() => createStandardAndLinkToActivity(evaluation)}
                            onCreateAction={() => openActionFormForEvaluation(evaluation)}
                            onSave={() => saveEvaluation(evaluation)}
                          />
                        )
                      })}
                    </div>
                  </section>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {activeTab === 'findings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gap Findings</CardTitle>
              <CardDescription>
                Vista filtrata delle valutazioni non conformi o parzialmente conformi, ordinate per priorita e severita del gap.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-4">
                <label className="block lg:col-span-1">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Cerca</span>
                  <span className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={findingSearch}
                      onChange={(event) => setFindingSearch(event.target.value)}
                      className="clinical-input pl-9"
                      placeholder="Attivita, gap, note..."
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Conformita</span>
                  <select
                    value={findingComplianceFilter}
                    onChange={(event) => setFindingComplianceFilter(event.target.value as FindingComplianceFilter)}
                    className="clinical-input"
                  >
                    <option value="all">Tutte</option>
                    <option value="non_compliant">Non conforme</option>
                    <option value="partially_compliant">Parzialmente conforme</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Priorita</span>
                  <select
                    value={findingPriorityFilter}
                    onChange={(event) => setFindingPriorityFilter(event.target.value as FindingPriorityFilter)}
                    className="clinical-input"
                  >
                    <option value="all">Tutte</option>
                    {RISK_PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Processo</span>
                  <select
                    value={findingProcessFilter}
                    onChange={(event) => setFindingProcessFilter(event.target.value)}
                    className="clinical-input"
                  >
                    <option value="all">Tutti</option>
                    {findingProcesses.map((processName) => (
                      <option key={processName} value={processName}>
                        {processName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </CardContent>
          </Card>

          {gapFindings.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-6 w-6" />}
              title="Nessun gap rilevato"
              description="Non sono presenti valutazioni non conformi o parzialmente conformi."
            />
          ) : filteredGapFindings.length === 0 ? (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="Nessun finding corrisponde ai filtri"
              description="Modifica i filtri o la ricerca per visualizzare altri gap."
            />
          ) : (
            <div className="grid gap-4">
              {filteredGapFindings.map((evaluation) => {
                const draft = drafts[evaluation.id]
                const changed = hasDraftChanges(evaluation, draft)
                const saving = savingEvaluationId === evaluation.id

                return (
                  <Card key={evaluation.id} className="border-red-100">
                    <CardContent className="p-5">
                      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {evaluation.activity_code_snapshot || 'Senza codice'}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getComplianceStatusColor(evaluation.compliance_status)}`}>
                              {getComplianceStatusLabel(evaluation.compliance_status)}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getGapRiskPriorityColor(evaluation.risk_priority)}`}>
                              Priorita {getGapRiskPriorityLabel(evaluation.risk_priority)}
                            </span>
                          </div>
                          <h3 className="mt-3 text-base font-semibold text-slate-950">
                            {evaluation.activity_name_snapshot || 'Attivita/Requisito senza nome'}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>Processo: {evaluation.process_name_snapshot || 'N/D'}</span>
                            <span>Dominio/Sezione: {evaluation.area_name_snapshot || 'N/D'}</span>
                          </div>
                        </div>

                        {evaluation.evaluated_at && (
                          <div className="text-xs text-slate-400 xl:text-right">
                            <p>Ultima valutazione</p>
                            <p className="font-medium text-slate-600">
                              {new Date(evaluation.evaluated_at).toLocaleString('it-IT')}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        {renderNormativeReferences(evaluation)}
                      </div>

                      {draft && (
                          <div className="grid gap-4">
                          <div className="grid gap-4 xl:grid-cols-3">
                            <label className="block">
                              <span className="mb-1 block text-sm font-medium text-slate-700">
                                Stato corrente
                              </span>
                              <textarea
                                value={draft.current_state}
                                onChange={(event) => updateDraft(evaluation.id, { current_state: event.target.value })}
                                className="clinical-input min-h-24 resize-y"
                                placeholder="Stato corrente rilevato."
                              />
                            </label>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                              <span className="mb-1 block text-sm font-medium text-slate-700">
                                Target atteso di riferimento
                              </span>
                              <p className="min-h-16 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {targetStateByActivityId[evaluation.activity_id] || 'Target atteso non definito nella libreria.'}
                              </p>
                              <p className="mt-2 text-xs leading-5 text-slate-500">
                                Il target appartiene all'Attivita/Requisito di libreria ed e mostrato in sola lettura.
                              </p>
                            </div>

                            <label className="block">
                              <span className="mb-1 block text-sm font-medium text-slate-700">
                                Gap rilevato rispetto al target
                              </span>
                              <textarea
                                value={draft.gap_description}
                                onChange={(event) => updateDraft(evaluation.id, { gap_description: event.target.value })}
                                className="clinical-input min-h-24 resize-y"
                                placeholder="Descrivi lo scostamento tra stato attuale e target atteso di riferimento."
                              />
                              <span className="mt-1 block text-xs leading-5 text-slate-500">
                                Descrivi lo scostamento tra stato attuale e target atteso di riferimento.
                              </span>
                            </label>
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            <label className="block">
                              <span className="mb-1 block text-sm font-medium text-slate-700">
                                Valutazione conformita
                              </span>
                              <select
                                value={draft.compliance_status}
                                onChange={(event) => updateDraft(evaluation.id, {
                                  compliance_status: event.target.value as ComplianceStatus,
                                })}
                                className="clinical-input"
                              >
                                {COMPLIANCE_STATUS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="block">
                              <span className="mb-1 block text-sm font-medium text-slate-700">
                                Priorita
                              </span>
                              <select
                                value={draft.risk_priority}
                                onChange={(event) => updateDraft(evaluation.id, {
                                  risk_priority: event.target.value as RiskPriority,
                                })}
                                className="clinical-input"
                              >
                                {RISK_PRIORITY_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="block">
                              <span className="mb-1 block text-sm font-medium text-slate-700">
                                Note
                              </span>
                              <textarea
                                value={draft.notes}
                                onChange={(event) => updateDraft(evaluation.id, { notes: event.target.value })}
                                className="clinical-input min-h-10 resize-y"
                                placeholder="Note sintetiche."
                              />
                            </label>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                            {changed && (
                              <button
                                type="button"
                                onClick={() => resetDraft(evaluation)}
                                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                Annulla modifiche
                              </button>
                            )}
                            <Button
                              type="button"
                              tone="success"
                              icon={<Save className="h-4 w-4" />}
                              loading={saving}
                              disabled={!changed || savingEvaluationId !== null}
                              onClick={() => saveEvaluation(evaluation)}
                            >
                              Salva finding
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'actions' && user?.id && (
        <GapActionPlanTab
          assessment={assessment}
          evaluations={gapFindings}
          actions={gapActions}
          userId={user.id}
          createRequest={actionCreateRequest}
          onActionsChange={setGapActions}
        />
      )}

    </div>
  )
}
