import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
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
  Search,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  createGapActivity,
  createGapActivityEvaluationForAssessment,
  createGapArea,
  createGapAction,
  createGapActionEvent,
  createGapStandard,
  deleteGapActivityEvaluation,
  getGapAssessmentById,
  getGapAssessmentProcessesWithStructure,
  getGapActivityStandardsForActivities,
  getGapActionRefsByAssessment,
  getGapActionsByAssessment,
  getGapEvaluationsByAssessment,
  getGapStandards,
  replaceGapActivityStandards,
  updateGapActivityEvaluation,
  updateGapAssessmentStatus,
  updateGapAssessmentStats,
  type GapActivityStandardLinkInput,
  type GapActionInput,
  type GapActionRef,
  type GapStandardInput,
  type GapAreaWithActivities,
  type GapProcessWithStructure,
} from '../../services/gapService'
import {
  exportGapAssessmentToExcel,
  exportGapAssessmentToPDF,
  type GapAssessmentPDFChartImages,
} from '../../services/gapExportService'
import type {
  ComplianceStatus,
  GapAction,
  GapActivityStandard,
  GapActivityEvaluation,
  GapAssessment,
  GapAssessmentStatus,
  GapStandard,
  RiskPriority,
} from '../../types/gap'
import { GapActionPlanTab } from '../../components/gap/GapActionPlanTab'
import { GapAssessmentStatsReport, type GapReportChartRefs } from '../../components/gap/GapAssessmentStatsReport'
import { GapEvaluationRow } from '../../components/gap/GapEvaluationRow'
import { GapInlineActivityForm, type GapInlineActivityFormPayload } from '../../components/gap/GapInlineActivityForm'
import { GapInlineDomainForm, type GapInlineDomainFormPayload } from '../../components/gap/GapInlineDomainForm'
import { aggregateAssessmentStats, isGapFinding } from '../../lib/gapScoring'
import {
  GAP_ASSESSMENT_STATUS_OPTIONS,
  getGapAssessmentStatusColor,
} from '../../lib/labels'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { elementToPngDataUrl } from '../../lib/exportImage'
import {
  GAP_PDF_EXPORT_WARNING_EVALUATIONS,
  GAP_ACTIONS_PER_ASSESSMENT_HARD_LIMIT,
  GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT,
  isGapHardLimitReached,
  isGapWarningLimitReached,
} from '../../lib/gapLimits'

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
  application_scope: string
  is_mandatory: boolean
  add_to_library: boolean
  description: string
  url: string
}

interface QuickActionDraft {
  description: string
  responsible: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  planned_start_date: string
  planned_end_date: string
  notes: string
}

type StandardsByActivityId = Record<string, GapActivityStandard[]>

type DetailTab = 'evaluation' | 'actions' | 'report'
type ActionCreateRequest = { evaluationId: string; requestId: number }
type EvaluationQuickFilter = 'all' | 'not_evaluated' | 'critical' | 'high_priority' | 'with_actions' | 'mandatory_standards' | 'assessment_only'

const emptyStandardForm: StandardFormState = {
  code: '',
  name: '',
  version: '',
  issuing_body: '',
  application_scope: '',
  is_mandatory: false,
  add_to_library: true,
  description: '',
  url: '',
}

const emptyQuickActionDraft: QuickActionDraft = {
  description: '',
  responsible: '',
  priority: 'medium',
  planned_start_date: '',
  planned_end_date: '',
  notes: '',
}

const evaluationQuickFilters: Array<{ value: EvaluationQuickFilter; label: string }> = [
  { value: 'all', label: 'Tutte' },
  { value: 'not_evaluated', label: 'Da valutare' },
  { value: 'critical', label: 'Criticità' },
  { value: 'high_priority', label: 'Alta priorità' },
  { value: 'with_actions', label: 'Con azioni' },
  { value: 'mandatory_standards', label: 'Con norme cogenti' },
  { value: 'assessment_only', label: 'Solo assessment' },
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

const sortGapActions = (actions: GapAction[]) => (
  [...actions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

const formatDomainDescription = (payload: GapInlineDomainFormPayload) => {
  const operationalContext = payload.operational_context.trim()
  const description = payload.description.trim()

  if (operationalContext && description) {
    return `Contesto operativo: ${operationalContext}\n\nDescrizione:\n${description}`
  }

  if (operationalContext) {
    return `Contesto operativo: ${operationalContext}`
  }

  return description
}

const getPayloadOrderIndex = (
  value: string,
  fallback: number,
) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
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
  const pdfComplianceByDomainRef = useRef<HTMLDivElement | null>(null)
  const pdfComplianceDistributionRef = useRef<HTMLDivElement | null>(null)
  const pdfPriorityDistributionRef = useRef<HTMLDivElement | null>(null)
  const pdfActionStatusRef = useRef<HTMLDivElement | null>(null)
  const pdfVerificationStatusRef = useRef<HTMLDivElement | null>(null)
  const pdfActionGanttRef = useRef<HTMLDivElement | null>(null)
  const pdfCaptureContainerRef = useRef<HTMLDivElement | null>(null)
  const commandBarAnchorRef = useRef<HTMLDivElement | null>(null)
  const commandBarContentRef = useRef<HTMLDivElement | null>(null)
  const [assessment, setAssessment] = useState<GapAssessment | null>(null)
  const [evaluations, setEvaluations] = useState<GapActivityEvaluation[]>([])
  const [assessmentProcesses, setAssessmentProcesses] = useState<GapProcessWithStructure[]>([])
  const [gapActions, setGapActions] = useState<GapAction[]>([])
  const [actionRefs, setActionRefs] = useState<GapActionRef[]>([])
  const [actionsLoaded, setActionsLoaded] = useState(false)
  const [loadingActions, setLoadingActions] = useState(false)
  const [standards, setStandards] = useState<GapStandard[]>([])
  const [standardsCatalogLoaded, setStandardsCatalogLoaded] = useState(false)
  const [loadingStandardsCatalog, setLoadingStandardsCatalog] = useState(false)
  const [standardsByActivityId, setStandardsByActivityId] = useState<StandardsByActivityId>({})
  const [drafts, setDrafts] = useState<Record<string, EvaluationDraft>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingAssessmentStatus, setSavingAssessmentStatus] = useState(false)
  const [savingEvaluationId, setSavingEvaluationId] = useState<string | null>(null)
  const [deletingEvaluationId, setDeletingEvaluationId] = useState<string | null>(null)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [renderPdfCapture, setRenderPdfCapture] = useState(false)
  const [pdfCaptureActions, setPdfCaptureActions] = useState<GapAction[] | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('evaluation')
  const [actionCreateRequest, setActionCreateRequest] = useState<ActionCreateRequest | null>(null)
  const [evaluationQuickFilter, setEvaluationQuickFilter] = useState<EvaluationQuickFilter>('all')
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
  const [quickActionEvaluationId, setQuickActionEvaluationId] = useState<string | null>(null)
  const [quickActionDraft, setQuickActionDraft] = useState<QuickActionDraft>(emptyQuickActionDraft)
  const [savingQuickAction, setSavingQuickAction] = useState(false)
  const [commandBarFixed, setCommandBarFixed] = useState(false)
  const [commandBarFrame, setCommandBarFrame] = useState({ left: 0, width: 0, height: 0 })

  const pdfChartRefs: GapReportChartRefs = {
    complianceByDomain: pdfComplianceByDomainRef,
    complianceDistribution: pdfComplianceDistributionRef,
    priorityDistribution: pdfPriorityDistributionRef,
    actionStatus: pdfActionStatusRef,
    verificationStatus: pdfVerificationStatusRef,
    actionGantt: pdfActionGanttRef,
  }

  useEffect(() => {
    if (!id || !user?.id) return

    let active = true

    const fetchAssessment = async () => {
      setLoading(true)
      setError(null)

      try {
        const [assessmentData, evaluationData, actionRefsData, processData] = await Promise.all([
          getGapAssessmentById(id, user.id),
          getGapEvaluationsByAssessment(id, user.id),
          getGapActionRefsByAssessment(id, user.id),
          getGapAssessmentProcessesWithStructure(id, user.id),
        ])

        if (!active) return

        setAssessment(assessmentData)
        setEvaluations(evaluationData)
        setAssessmentProcesses(processData)
        setSelectedProcessForDomain(processData[0]?.id || '')
        setSelectedProcessForActivity(processData[0]?.id || '')
        setSelectedAreaForActivity(processData[0]?.areas[0]?.id || '')
        setGapActions([])
        setActionRefs(actionRefsData)
        setActionsLoaded(false)
        setLoadingActions(false)
        setStandards([])
        setStandardsCatalogLoaded(false)
        setLoadingStandardsCatalog(false)
        setStandardsByActivityId({})
        setEditingStandardsEvaluationId(null)
        setStandardDraftLinks([])
        setShowCreateStandardForm(false)
        setNewStandardForm(emptyStandardForm)
        setQuickActionEvaluationId(null)
        setQuickActionDraft(emptyQuickActionDraft)
        setSavingQuickAction(false)
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
            setError('Assessment caricato, ma non è stato possibile caricare alcuni riferimenti normativi.')
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

  useEffect(() => {
    const updateCommandBarPosition = () => {
      const anchor = commandBarAnchorRef.current
      const content = commandBarContentRef.current
      if (!anchor || !content) return

      const rect = anchor.getBoundingClientRect()
      const topOffset = window.innerWidth < 1024 ? 64 : 0
      const nextFixed = rect.top <= topOffset
      const nextFrame = {
        left: Math.max(rect.left, 0),
        width: rect.width,
        height: content.offsetHeight,
      }

      setCommandBarFixed(nextFixed)
      setCommandBarFrame((current) => (
        current.left === nextFrame.left &&
        current.width === nextFrame.width &&
        current.height === nextFrame.height
          ? current
          : nextFrame
      ))
    }

    const scrollParent = commandBarAnchorRef.current?.closest('main')
    updateCommandBarPosition()
    window.addEventListener('scroll', updateCommandBarPosition, { passive: true })
    window.addEventListener('resize', updateCommandBarPosition)
    scrollParent?.addEventListener('scroll', updateCommandBarPosition, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateCommandBarPosition)
      window.removeEventListener('resize', updateCommandBarPosition)
      scrollParent?.removeEventListener('scroll', updateCommandBarPosition)
    }
  }, [
    actionRefs.length,
    activeTab,
    actionsLoaded,
    evaluationQuickFilter,
    gapActions.length,
    showActivityForm,
    showDomainForm,
  ])

  const ensureActionsLoaded = async (): Promise<GapAction[]> => {
    if (actionsLoaded) return gapActions
    if (!id || !user?.id) return []

    setLoadingActions(true)
    setError(null)

    try {
      const actionsData = await getGapActionsByAssessment(id, user.id)
      setGapActions(actionsData)
      setActionRefs(actionsData.map((action) => ({
        id: action.id,
        evaluation_id: action.evaluation_id,
      })))
      setActionsLoaded(true)
      return actionsData
    } catch (loadError) {
      console.error('Errore caricamento azioni Gap:', loadError)
      setError('Impossibile caricare le azioni correttive Gap.')
      throw loadError
    } finally {
      setLoadingActions(false)
    }
  }

  const ensureStandardsCatalogLoaded = async (): Promise<GapStandard[]> => {
    if (standardsCatalogLoaded) return standards
    if (!user?.id) return []

    setLoadingStandardsCatalog(true)
    setError(null)

    try {
      const standardsData = await getGapStandards(user.id)
      setStandards(standardsData)
      setStandardsCatalogLoaded(true)
      return standardsData
    } catch (loadError) {
      console.error('Errore caricamento catalogo norme Gap:', loadError)
      setError('Impossibile caricare il catalogo norme Gap.')
      throw loadError
    } finally {
      setLoadingStandardsCatalog(false)
    }
  }

  const changeTab = (nextTab: DetailTab) => {
    setActiveTab(nextTab)
    if (nextTab !== 'evaluation') {
      setShowDomainForm(false)
      setShowActivityForm(false)
    }
    if (nextTab === 'actions' || nextTab === 'report') {
      void ensureActionsLoaded().catch(() => undefined)
    }
  }

  const stats = useMemo(() => aggregateAssessmentStats(evaluations), [evaluations])
  const criticalCount = stats.partial_count + stats.non_compliant_count
  const evaluationVolumeWarning = isGapWarningLimitReached(
    evaluations.length,
    GAP_PDF_EXPORT_WARNING_EVALUATIONS,
  )
  const gapFindings = useMemo(() => {
    return evaluations
      .filter(isGapFinding)
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.risk_priority] - priorityOrder[b.risk_priority]
        if (priorityDiff !== 0) return priorityDiff

        const complianceDiff = (complianceOrder[a.compliance_status] ?? 99) - (complianceOrder[b.compliance_status] ?? 99)
        if (complianceDiff !== 0) return complianceDiff

        return (a.activity_code_snapshot || '').localeCompare(b.activity_code_snapshot || '')
      })
  }, [evaluations])
  const actionCountByEvaluationId = useMemo(() => {
    const actionSource = actionsLoaded ? gapActions : actionRefs

    return actionSource.reduce<Record<string, number>>((acc, action) => ({
      ...acc,
      [action.evaluation_id]: (acc[action.evaluation_id] || 0) + 1,
    }), {})
  }, [actionRefs, actionsLoaded, gapActions])
  const openActionsCount = useMemo(() => {
    if (!actionsLoaded) return actionRefs.length

    return gapActions.filter((action) => !['completed', 'verified', 'closed'].includes(action.status)).length
  }, [actionRefs.length, actionsLoaded, gapActions])
  const actionsByEvaluationId = useMemo(() => {
    return gapActions.reduce<Record<string, GapAction[]>>((acc, action) => ({
      ...acc,
      [action.evaluation_id]: [...(acc[action.evaluation_id] || []), action],
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
  const activityAssessmentOnlyById = useMemo(() => {
    return assessmentProcesses.reduce<Record<string, boolean>>((acc, process) => {
      process.areas.forEach((area) => {
        area.activities.forEach((activity) => {
          acc[activity.id] = activity.source_type === 'assessment_only'
        })
      })

      return acc
    }, {})
  }, [assessmentProcesses])
  const areaAssessmentOnlyByActivityId = useMemo(() => {
    return assessmentProcesses.reduce<Record<string, boolean>>((acc, process) => {
      process.areas.forEach((area) => {
        area.activities.forEach((activity) => {
          acc[activity.id] = area.source_type === 'assessment_only'
        })
      })

      return acc
    }, {})
  }, [assessmentProcesses])
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((evaluation) => {
      switch (evaluationQuickFilter) {
        case 'not_evaluated':
          return evaluation.compliance_status === 'not_evaluated'
        case 'critical':
          return isGapFinding(evaluation)
        case 'high_priority':
          return evaluation.risk_priority === 'high'
        case 'with_actions':
          return (actionCountByEvaluationId[evaluation.id] || 0) > 0
        case 'mandatory_standards':
          return Boolean(
            standardsByActivityId[evaluation.activity_id]?.some((link) => link.standard?.is_mandatory),
          )
        case 'assessment_only':
          return Boolean(
            activityAssessmentOnlyById[evaluation.activity_id] ||
            areaAssessmentOnlyByActivityId[evaluation.activity_id],
          )
        case 'all':
        default:
          return true
      }
    })
  }, [
    actionCountByEvaluationId,
    activityAssessmentOnlyById,
    areaAssessmentOnlyByActivityId,
    evaluationQuickFilter,
    evaluations,
    standardsByActivityId,
  ])
  const groupedEvaluations = useMemo(() => groupEvaluations(filteredEvaluations), [filteredEvaluations])

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

  const startEditStandards = async (evaluation: GapActivityEvaluation) => {
    try {
      await ensureStandardsCatalogLoaded()
    } catch {
      return
    }

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

      if (current.length >= GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT) {
        setError(
          `Per mantenere prestazioni fluide, collega al massimo ${GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT} norme essenziali a una singola AttivitÃ /Requisito.`,
        )
        return current
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

    if (standardDraftLinks.length > GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT) {
      setError(
        `Per mantenere prestazioni fluide, collega al massimo ${GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT} norme essenziali a una singola AttivitÃ /Requisito.`,
      )
      return
    }

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
      console.error('Errore salvataggio norme Attività/Requisito:', saveError)
      setError("Impossibile salvare le norme collegate all'Attività/Requisito.")
    } finally {
      setSavingStandards(false)
    }
  }

  const createStandardAndLinkToActivity = async (evaluation: GapActivityEvaluation) => {
    if (!user?.id) return
    if (!assessment?.id) return

    if (standardDraftLinks.length >= GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT) {
      setError(
        `Per mantenere prestazioni fluide, collega al massimo ${GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT} norme essenziali a una singola AttivitÃ /Requisito.`,
      )
      return
    }

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
        application_scope: toNullable(newStandardForm.application_scope),
        is_mandatory: newStandardForm.is_mandatory,
        description: toNullable(newStandardForm.description),
        url: toNullable(newStandardForm.url),
        source_type: newStandardForm.add_to_library ? 'library' : 'assessment_only',
        created_in_assessment_id: newStandardForm.add_to_library ? null : assessment?.id || null,
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

      if (newStandardForm.add_to_library) {
        setStandards((current) => [...current, createdStandard].sort((a, b) =>
          a.code.localeCompare(b.code) || a.name.localeCompare(b.name),
        ))
      }
      setStandardsCatalogLoaded(true)
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
    if (!user?.id || !assessment?.id || !selectedProcessForDomain) return

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
        description: toNullable(formatDomainDescription(payload)),
        order_index: getPayloadOrderIndex(payload.order_index, getNextOrderIndex(process.areas)),
        source_type: payload.add_to_library ? 'library' : 'assessment_only',
        created_in_assessment_id: payload.add_to_library ? null : assessment.id,
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
      setError("Il nome dell'Attività/Requisito è obbligatorio.")
      return
    }

    if (!payload.target_state.trim()) {
      setError("Il target atteso di riferimento è obbligatorio per creare una nuova Attività/Requisito.")
      return
    }

    const generatedCode = getNextActivityCode(selectedActivityArea)
    if (!generatedCode) {
      setError('Non si possono inserire più di 99 Attività/Requisiti per Dominio/Sezione. Procedi con la creazione di un nuovo Dominio/Sezione.')
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
        source_type: payload.add_to_library ? 'library' : 'assessment_only',
        created_in_assessment_id: payload.add_to_library ? null : assessment.id,
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
      console.error('Errore creazione Attività/Requisito Gap:', createError)
      setError("Impossibile creare l'Attività/Requisito nell'assessment Gap.")
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
          "Valutazione salvata, ma gli indicatori dell'assessment non sono stati aggiornati. Ricarica la pagina o riprova il salvataggio.",
        )
      }
    } catch (saveError) {
      console.error('Errore salvataggio evaluation Gap:', saveError)
      setError('Impossibile salvare la valutazione. Verifica i dati e riprova.')
    } finally {
      setSavingEvaluationId(null)
    }
  }

  const removeEvaluationFromAssessment = async (evaluation: GapActivityEvaluation) => {
    if (!user?.id || !assessment) return

    const actionCount = actionCountByEvaluationId[evaluation.id] || 0
    const confirmed = confirm(
      actionCount > 0
        ? `Rimuovere "${evaluation.activity_code_snapshot || evaluation.activity_name_snapshot}" dall'assessment? Verranno eliminate anche ${actionCount === 1 ? "l'azione correttiva collegata" : 'le azioni correttive collegate'}. L'Attivita/Requisito restera nella libreria.`
        : `Rimuovere "${evaluation.activity_code_snapshot || evaluation.activity_name_snapshot}" dall'assessment? L'Attivita/Requisito restera nella libreria.`,
    )
    if (!confirmed) return

    setDeletingEvaluationId(evaluation.id)
    setError(null)

    try {
      await deleteGapActivityEvaluation(evaluation.id, user.id)

      const nextEvaluations = evaluations.filter((item) => item.id !== evaluation.id)
      const nextStats = aggregateAssessmentStats(nextEvaluations)
      const updatedAssessment = await updateGapAssessmentStats(assessment.id, user.id, nextStats)

      setEvaluations(nextEvaluations)
      setGapActions((current) => current.filter((action) => action.evaluation_id !== evaluation.id))
      setActionRefs((current) => current.filter((action) => action.evaluation_id !== evaluation.id))
      setDrafts((current) => {
        const next = { ...current }
        delete next[evaluation.id]
        return next
      })
      setAssessment(updatedAssessment)
      setExpandedEvaluationId((current) => (current === evaluation.id ? null : current))
      if (editingStandardsEvaluationId === evaluation.id) {
        resetStandardEditor()
      }
    } catch (deleteError) {
      console.error('Errore rimozione evaluation Gap:', deleteError)
      setError("Impossibile rimuovere l'Attivita/Requisito dall'assessment.")
    } finally {
      setDeletingEvaluationId(null)
    }
  }

  const changeAssessmentStatus = async (status: GapAssessmentStatus) => {
    if (!assessment || !user?.id || status === assessment.status) return

    if (status === 'archived') {
      const confirmed = confirm("Archiviare questo assessment? Sarà spostato nell'Archivio assessment.")
      if (!confirmed) return
    }

    setSavingAssessmentStatus(true)
    setError(null)

    try {
      const updated = await updateGapAssessmentStatus(assessment.id, user.id, status)
      setAssessment(updated)
    } catch (statusError) {
      console.error('Errore aggiornamento stato assessment Gap:', statusError)
      setError("Impossibile aggiornare lo stato dell'assessment Gap.")
    } finally {
      setSavingAssessmentStatus(false)
    }
  }

  const handleExportExcel = async () => {
    if (!assessment) return

    setExportingExcel(true)
    setError(null)

    try {
      const actionsForExport = await ensureActionsLoaded()
      exportGapAssessmentToExcel({
        assessment,
        evaluations,
        actions: actionsForExport,
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

  const waitForPdfCaptureRender = async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve())
        })
      })

      if (pdfCaptureContainerRef.current) return
    }

    console.warn('Export PDF Gap: contenitore grafici non disponibile per la cattura.')
  }

  const captureReportChartImages = async (): Promise<GapAssessmentPDFChartImages> => {
    await waitForPdfCaptureRender()

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 150)
    })

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })

    const capture = async (element: HTMLElement | null, label: string) => {
      if (!element) {
        console.warn(`Grafico Gap non disponibile per PDF: ref mancante (${label}).`)
        return null
      }

      try {
        return await elementToPngDataUrl(element)
      } catch (captureError) {
        console.warn(`Impossibile acquisire grafico Gap per PDF: ${label}`, captureError)
        return null
      }
    }

    const [
      complianceByDomain,
      complianceDistribution,
      priorityDistribution,
      actionStatus,
      verificationStatus,
      actionGantt,
    ] = await Promise.all([
      capture(pdfComplianceByDomainRef.current, 'compliance per Dominio/Sezione'),
      capture(pdfComplianceDistributionRef.current, 'distribuzione conformità'),
      capture(pdfPriorityDistributionRef.current, 'priorità gap'),
      capture(pdfActionStatusRef.current, 'stato azioni'),
      capture(pdfVerificationStatusRef.current, 'verifica efficacia'),
      capture(pdfActionGanttRef.current, 'Diagramma di GANTT azioni'),
    ])

    return {
      complianceByDomain,
      complianceDistribution,
      priorityDistribution,
      actionStatus,
      verificationStatus,
      actionGantt,
    }
  }

  const handleExportPDF = async () => {
    if (!assessment) return

    if (
      evaluationVolumeWarning &&
      !confirm(
        `Questo assessment contiene ${evaluations.length} AttivitÃ /Requisiti. L'export PDF potrebbe richiedere piÃ¹ tempo. Vuoi continuare?`,
      )
    ) {
      return
    }

    setExportingPDF(true)
    setError(null)

    try {
      const actionsForExport = await ensureActionsLoaded()
      flushSync(() => {
        setPdfCaptureActions(actionsForExport)
        setRenderPdfCapture(true)
      })
      const chartImages = await captureReportChartImages()
      exportGapAssessmentToPDF({
        assessment,
        evaluations,
        actions: actionsForExport,
        standardsByActivityId,
        targetStateByActivityId,
        chartImages,
      })
    } catch (exportError) {
      console.error('Errore export PDF Gap:', exportError)
      setError('Impossibile esportare il file PDF Gap. Riprova tra qualche istante.')
    } finally {
      setRenderPdfCapture(false)
      setPdfCaptureActions(null)
      setExportingPDF(false)
    }
  }

  const openQuickActionFormForEvaluation = async (evaluation: GapActivityEvaluation) => {
    if (!isGapFinding(evaluation)) {
      setError('Le azioni correttive possono essere create solo da valutazioni non conformi o parzialmente conformi.')
      return
    }

    const currentActionCount = actionsLoaded ? gapActions.length : actionRefs.length
    if (isGapHardLimitReached(currentActionCount, GAP_ACTIONS_PER_ASSESSMENT_HARD_LIMIT)) {
      setError(
        `Questo assessment contiene gia ${currentActionCount} azioni correttive. Per mantenere prestazioni fluide, modifica o chiudi le azioni esistenti prima di crearne altre.`,
      )
      return
    }

    setError(null)
    setQuickActionEvaluationId((current) => (current === evaluation.id ? null : evaluation.id))
    setQuickActionDraft(emptyQuickActionDraft)

    if ((actionCountByEvaluationId[evaluation.id] || 0) > 0 && !actionsLoaded) {
      void ensureActionsLoaded().catch(() => undefined)
    }
  }

  const closeQuickActionForm = () => {
    setQuickActionEvaluationId(null)
    setQuickActionDraft(emptyQuickActionDraft)
  }

  const saveQuickActionForEvaluation = async (evaluation: GapActivityEvaluation) => {
    if (!assessment || !user?.id) return

    if (!quickActionDraft.description.trim()) {
      setError("La descrizione dell'azione correttiva e obbligatoria.")
      return
    }

    if (
      quickActionDraft.planned_start_date &&
      quickActionDraft.planned_end_date &&
      quickActionDraft.planned_start_date > quickActionDraft.planned_end_date
    ) {
      setError('La data di inizio non può essere successiva alla fine pianificata.')
      return
    }

    setSavingQuickAction(true)
    setError(null)

    try {
      const currentActions = await ensureActionsLoaded()
      if (isGapHardLimitReached(currentActions.length, GAP_ACTIONS_PER_ASSESSMENT_HARD_LIMIT)) {
        setError(
          `Questo assessment contiene gia ${currentActions.length} azioni correttive. Per mantenere prestazioni fluide, modifica o chiudi le azioni esistenti prima di crearne altre.`,
        )
        return
      }

      const actionInput: GapActionInput = {
        description: quickActionDraft.description.trim(),
        responsible: toNullable(quickActionDraft.responsible),
        priority: quickActionDraft.priority,
        status: 'planned',
        progress: 0,
        phase: 'planning',
        planned_start_date: toNullable(quickActionDraft.planned_start_date),
        planned_end_date: toNullable(quickActionDraft.planned_end_date),
        notes: toNullable(quickActionDraft.notes),
      }
      const created = await createGapAction(user.id, assessment.id, evaluation, actionInput)
      await createGapActionEvent(user.id, created, 'created', 'Azione correttiva creata da valutazione.')
      const nextActions = sortGapActions([created, ...currentActions])

      setGapActions(nextActions)
      setActionRefs((current) => (
        current.some((action) => action.id === created.id)
          ? current
          : [{ id: created.id, evaluation_id: created.evaluation_id }, ...current]
      ))
      setActionsLoaded(true)
      closeQuickActionForm()
    } catch (createError) {
      console.error('Errore creazione rapida azione Gap:', createError)
      setError("Impossibile creare l'azione correttiva Gap.")
    } finally {
      setSavingQuickAction(false)
    }
  }

  const manageActionsForEvaluation = (evaluation: GapActivityEvaluation) => {
    setQuickActionEvaluationId(null)
    setActiveTab('actions')
    void ensureActionsLoaded().catch(() => undefined)
    setExpandedEvaluationId(null)
    if ((actionCountByEvaluationId[evaluation.id] || 0) === 0 && isGapFinding(evaluation)) {
      setActionCreateRequest((current) => ({
        evaluationId: evaluation.id,
        requestId: (current?.requestId || 0) + 1,
      }))
    }
  }

  const renderAssessmentCommandBar = () => (
    <div ref={commandBarAnchorRef} className="relative mb-5">
      {commandBarFixed && (
        <div style={{ height: commandBarFrame.height }} aria-hidden="true" />
      )}
      <div
        ref={commandBarContentRef}
        className={`rounded-xl border border-slate-200 bg-white/95 shadow-clinical-soft backdrop-blur supports-[backdrop-filter]:bg-white/90 ${
          commandBarFixed ? 'fixed top-16 z-40 lg:top-0' : 'relative z-30'
        }`}
        style={commandBarFixed ? {
          left: commandBarFrame.left,
          width: commandBarFrame.width,
        } : undefined}
      >
      <div className="space-y-3 p-3">
        <div className="grid gap-3 border-b border-slate-100 pb-3 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)] xl:items-start">
          <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              onClick={() => changeTab('evaluation')}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === 'evaluation'
                  ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Valutazione
            </button>
            <button
              type="button"
              onClick={() => changeTab('actions')}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === 'actions'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Azioni correttive
              <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs">
                {actionsLoaded ? gapActions.length : actionRefs.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => changeTab('report')}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === 'report'
                  ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Statistiche e report
            </button>
          </div>

          {activeTab === 'evaluation' && (
            <div className="min-w-0 rounded-lg bg-slate-50/80 px-3 py-2 xl:text-right">
              <p className="text-sm font-medium text-slate-800">
                Clicca su un'Attività/Requisito per compilare o aggiornare la valutazione.
              </p>
              <div className="mt-1 flex flex-col gap-1 text-xs text-slate-500 xl:items-end">
                <span>
                  Processo {'->'} Dominio/Sezione {'->'} Contesto operativo {'->'} Attività/Requisito
                </span>
                <span className="text-teal-700">
                  Aggiungi elementi mentre compili la valutazione.
                </span>
              </div>
              <div className="hidden">
                <Button
                  type="button"
                  variant={showDomainForm ? 'primary' : 'outline'}
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  className="whitespace-nowrap"
                  onClick={() => {
                    setShowDomainForm((current) => !current)
                    setShowActivityForm(false)
                  }}
                >
                  Dominio/Sezione
                </Button>
                <Button
                  type="button"
                  variant={showActivityForm ? 'primary' : 'outline'}
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  className="whitespace-nowrap"
                  onClick={() => {
                    setShowActivityForm((current) => !current)
                    setShowDomainForm(false)
                  }}
                >
                  Attività/Requisito
                </Button>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'evaluation' && (
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="hidden">
              <p className="text-sm font-medium text-slate-800">
                Clicca su un'Attività/Requisito per compilare o aggiornare la valutazione.
              </p>
              <div className="mt-1 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
                <span>
                  Processo {'->'} Dominio/Sezione {'->'} Contesto operativo {'->'} Attività/Requisito
                </span>
                <span className="text-teal-700">
                  Aggiungi elementi mentre compili la valutazione.
                </span>
              </div>
            </div>

            <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1">
              {evaluationQuickFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setEvaluationQuickFilter(filter.value)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    evaluationQuickFilter === filter.value
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:w-[380px]">
              <Button
                type="button"
                variant={showDomainForm ? 'primary' : 'outline'}
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                className="border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-800 shadow-sm hover:border-teal-300 hover:bg-teal-100 hover:text-teal-900 hover:shadow-md"
                onClick={() => {
                  setShowDomainForm((current) => !current)
                  setShowActivityForm(false)
                }}
              >
                Dominio/Sezione
              </Button>
              <Button
                type="button"
                variant={showActivityForm ? 'primary' : 'outline'}
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                className="border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-800 shadow-sm hover:border-teal-300 hover:bg-teal-100 hover:text-teal-900 hover:shadow-md"
                onClick={() => {
                  setShowActivityForm((current) => !current)
                  setShowDomainForm(false)
                }}
              >
                Attività/Requisito
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )

  const renderAssessmentEnrichment = () => (
    <>
    <div className="hidden">
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">ARRICCHISCI ASSESSMENT</p>
          <p className="hidden text-xs leading-4 text-slate-500 md:block">
            Aggiungi elementi mentre scorri la valutazione.
          </p>
        </div>
        <div className="grid gap-2">
          <Button
            type="button"
            variant={showDomainForm ? 'primary' : 'outline'}
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            className="w-full"
            onClick={() => {
              setShowDomainForm((current) => !current)
              setShowActivityForm(false)
            }}
          >
            Dominio/Sezione
          </Button>
          <Button
            type="button"
            variant={showActivityForm ? 'primary' : 'outline'}
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            className="w-full"
            onClick={() => {
              setShowActivityForm((current) => !current)
              setShowDomainForm(false)
            }}
          >
            Attività/Requisito
          </Button>
        </div>
      </div>
    </div>

      {(showDomainForm || showActivityForm) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="mx-auto my-6 w-full max-w-5xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-base font-semibold text-slate-950">
                  {showDomainForm ? 'Nuovo Dominio/Sezione' : 'Nuova Attività/Requisito'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {showDomainForm
                    ? 'Aggiungi un Dominio/Sezione senza perdere il punto della valutazione.'
                    : 'Aggiungi una Attività/Requisito senza comprimere la lista dell assessment.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDomainForm(false)
                  setShowActivityForm(false)
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Chiudi
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
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
                showLibraryToggle
                defaultAddToLibrary={false}
                onCancel={() => setShowDomainForm(false)}
                onSubmit={addDomainToAssessmentProcess}
              />
            </div>
          )}

          {showActivityForm && (
            <div className="space-y-3">
              <div className="grid gap-4">
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
                  showLibraryToggle
                  defaultAddToLibrary={false}
                  onCancel={() => setShowActivityForm(false)}
                  onSubmit={addActivityToAssessment}
                />
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      )}
    </>
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
            Nessun riferimento normativo collegato all'Attività/Requisito.
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
  void renderNormativeReferences

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
          description="L'assessment richiesto non esiste oppure non è accessibile con l'utente corrente."
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
    <div className="clinical-page xl:max-w-[86rem]">
      <PageHeader
        title={assessment.title}
        description={assessment.description || 'Valuta conformità, gap e priorità per ogni Attività/Requisito selezionato.'}
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
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stato</span>
              <select
                value={assessment.status}
                disabled={savingAssessmentStatus}
                onChange={(event) => changeAssessmentStatus(event.target.value as GapAssessmentStatus)}
                className={`rounded-full border-0 px-3 py-1 text-sm font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60 ${getGapAssessmentStatusColor(assessment.status)}`}
              >
                {GAP_ASSESSMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reparto / Unità</p>
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

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        <StatCard
          label="Attività/Requisiti"
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
          label="Criticità"
          value={criticalCount}
          icon={<AlertTriangle className="h-6 w-6" />}
          tone="risk"
        />
        <StatCard
          label="Azioni aperte"
          value={openActionsCount}
          icon={<ClipboardList className="h-6 w-6" />}
          tone="clinical"
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

      {renderAssessmentCommandBar()}

      {activeTab === 'evaluation' && (evaluations.length === 0 ? (
        <div className="space-y-6">
          {renderAssessmentEnrichment()}

          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title="Nessuna valutazione disponibile"
            description="Questo assessment non contiene ancora Attività/Requisiti da valutare."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {renderAssessmentEnrichment()}

          {evaluationVolumeWarning && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              Questo assessment contiene {evaluations.length} AttivitÃ /Requisiti. Per mantenere la valutazione fluida, valuta di lavorare per filtri o di dividere futuri assessment molto estesi in piÃ¹ parti.
            </div>
          )}

          <Card className="hidden">
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Clicca su un'Attività/Requisito per compilare o aggiornare la valutazione.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Gerarchia: Processo {'->'} Dominio/Sezione {'->'} Contesto operativo {'->'} Attività/Requisito.
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
              title="Nessuna Attività/Requisito corrisponde al filtro"
              description="Seleziona un filtro diverso per visualizzare altre valutazioni."
            />
          ) : groupedEvaluations.map((processGroup) => (
            <Card key={processGroup.processName}>
              <CardHeader>
                <CardTitle>{processGroup.processName}</CardTitle>
                <CardDescription>
                  Valutazioni organizzate per Dominio/Sezione e Attività/Requisito.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {processGroup.areas.map((areaGroup) => {
                  const areaIsAssessmentOnly = areaGroup.evaluations.some((evaluation) => (
                    areaAssessmentOnlyByActivityId[evaluation.activity_id]
                  ))

                  return (
                  <section key={`${processGroup.processName}-${areaGroup.areaName}`} className="space-y-4">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                          {areaGroup.areaName}
                        </h2>
                        {areaIsAssessmentOnly && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            Solo assessment
                          </span>
                        )}
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {areaGroup.evaluations.length} Attività/Requisiti
                      </span>
                    </div>

                    <div className="grid gap-4">
                      <div className="hidden rounded-lg border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 2xl:grid 2xl:grid-cols-[120px_minmax(150px,1.2fr)_minmax(150px,1fr)_120px_120px_100px_90px_150px_44px] 2xl:items-center">
                        <span>Codice</span>
                        <span>Attività/Requisito</span>
                        <span>Dominio/Sezione</span>
                        <span>Conformità</span>
                        <span>Priorità</span>
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
                            deleting={deletingEvaluationId === evaluation.id}
                            actionCount={actionCountByEvaluationId[evaluation.id] || 0}
                            actions={actionsByEvaluationId[evaluation.id] || []}
                            actionsLoaded={actionsLoaded}
                            standards={standardsByActivityId[evaluation.activity_id] || []}
                            targetState={targetStateByActivityId[evaluation.activity_id] || null}
                            assessmentOnly={activityAssessmentOnlyById[evaluation.activity_id]}
                            standardsCatalog={standards}
                            standardsEditorOpen={editingStandardsEvaluationId === evaluation.id}
                            standardDraftLinks={standardDraftLinks}
                            savingStandards={savingStandards || loadingStandardsCatalog}
                            showCreateStandardForm={showCreateStandardForm}
                            newStandardForm={newStandardForm}
                            savingNewStandard={savingNewStandard}
                            savingDisabled={savingEvaluationId !== null || deletingEvaluationId !== null}
                            onToggle={() => {
                              const opening = expandedEvaluationId !== evaluation.id
                              resetStandardEditor()
                              setExpandedEvaluationId((current) => (
                                current === evaluation.id ? null : evaluation.id
                              ))
                              if (opening && (actionCountByEvaluationId[evaluation.id] || 0) > 0 && !actionsLoaded) {
                                void ensureActionsLoaded().catch(() => undefined)
                              }
                            }}
                            onManageStandards={() => (
                              editingStandardsEvaluationId === evaluation.id
                                ? resetStandardEditor()
                                : void startEditStandards(evaluation)
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
                            quickActionOpen={quickActionEvaluationId === evaluation.id}
                            quickActionDraft={quickActionDraft}
                            savingQuickAction={savingQuickAction && quickActionEvaluationId === evaluation.id}
                            quickActionDisabled={isGapHardLimitReached(
                              actionsLoaded ? gapActions.length : actionRefs.length,
                              GAP_ACTIONS_PER_ASSESSMENT_HARD_LIMIT,
                            )}
                            onCreateAction={() => openQuickActionFormForEvaluation(evaluation)}
                            onManageActions={() => manageActionsForEvaluation(evaluation)}
                            onCloseQuickAction={closeQuickActionForm}
                            onQuickActionDraftChange={(patch) => setQuickActionDraft((current) => ({ ...current, ...patch }))}
                            onSaveQuickAction={() => saveQuickActionForEvaluation(evaluation)}
                            onDelete={() => removeEvaluationFromAssessment(evaluation)}
                            onSave={() => saveEvaluation(evaluation)}
                          />
                        )
                      })}
                    </div>
                  </section>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {/* La vecchia tab "Gap rilevati" è stata rimossa: le criticità sono ora un filtro della Valutazione.
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gap rilevati</CardTitle>
              <CardDescription>
                Vista filtrata delle valutazioni non conformi o parzialmente conformi, ordinate per priorità e severità del gap.
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
                      placeholder="Attività, gap, note..."
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Conformità</span>
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
                  <span className="mb-1 block text-sm font-medium text-slate-700">Priorità</span>
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
                const expanded = expandedFindingId === evaluation.id

                return (
                  <Card key={evaluation.id} className={cn('overflow-hidden', expanded ? 'border-red-100' : 'border-slate-200')}>
                    <button
                      type="button"
                      onClick={() => setExpandedFindingId((current) => (current === evaluation.id ? null : evaluation.id))}
                      className="group w-full px-5 py-4 text-left transition hover:bg-red-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {evaluation.activity_code_snapshot || 'Senza codice'}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getComplianceStatusColor(evaluation.compliance_status)}`}>
                              {getComplianceStatusLabel(evaluation.compliance_status)}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getGapRiskPriorityColor(evaluation.risk_priority)}`}>
                              Priorità {getGapRiskPriorityLabel(evaluation.risk_priority)}
                            </span>
                          </div>
                          <h3 className="mt-3 text-base font-semibold text-slate-950">
                            {evaluation.activity_name_snapshot || 'Attività/Requisito senza nome'}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>Processo: {evaluation.process_name_snapshot || 'N/D'}</span>
                            <span>Dominio/Sezione: {evaluation.area_name_snapshot || 'N/D'}</span>
                          </div>
                          {evaluation.gap_description && (
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                              {evaluation.gap_description}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-3 xl:justify-end">
                          {evaluation.evaluated_at && (
                            <div className="text-xs text-slate-400 xl:text-right">
                              <p>Ultima valutazione</p>
                              <p className="font-medium text-slate-600">
                                {new Date(evaluation.evaluated_at).toLocaleString('it-IT')}
                              </p>
                            </div>
                          )}
                          <span
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-700 transition group-hover:bg-red-50"
                            aria-hidden="true"
                          >
                            {expanded ? <ChevronDown className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                          </span>
                        </div>
                      </div>
                    </button>

                    {expanded && (
                    <CardContent className="border-t border-slate-100 p-5">

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
                                Il target appartiene all'Attività/Requisito di libreria ed è mostrato in sola lettura.
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
                                Valutazione conformità
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
                                Priorità
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
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      */}

      {activeTab === 'actions' && user?.id && (
        loadingActions && !actionsLoaded ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-sm text-slate-600">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              Caricamento azioni correttive...
            </CardContent>
          </Card>
        ) : (
          <GapActionPlanTab
            assessment={assessment}
            evaluations={gapFindings}
            actions={gapActions}
            userId={user.id}
            createRequest={actionCreateRequest}
            onActionsChange={(nextActions) => {
              setGapActions(nextActions)
              setActionRefs(nextActions.map((action) => ({
                id: action.id,
                evaluation_id: action.evaluation_id,
              })))
            }}
          />
        )
      )}

      {activeTab === 'report' && (
        loadingActions && !actionsLoaded ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-sm text-slate-600">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
              Caricamento dati azioni per statistiche e report...
            </CardContent>
          </Card>
        ) : (
          <GapAssessmentStatsReport
            assessment={assessment}
            evaluations={evaluations}
            actions={gapActions}
            standardsByActivityId={standardsByActivityId}
            targetStateByActivityId={targetStateByActivityId}
          />
        )
      )}

      {renderPdfCapture && (
        <div
          ref={pdfCaptureContainerRef}
          className="pointer-events-none fixed -left-[10000px] top-0 w-[1180px] bg-white p-6"
          aria-hidden="true"
        >
          <GapAssessmentStatsReport
            assessment={assessment}
            evaluations={evaluations}
            actions={pdfCaptureActions ?? gapActions}
            standardsByActivityId={standardsByActivityId}
            targetStateByActivityId={targetStateByActivityId}
            chartRefs={pdfChartRefs}
          />
        </div>
      )}

    </div>
  )
}
