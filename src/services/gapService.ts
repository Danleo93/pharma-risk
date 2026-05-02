import { supabase } from '../lib/supabase'
import type {
  ComplianceStatus,
  GapAction,
  GapActionEvent,
  GapActionEventType,
  GapActionPhase,
  GapActionPriority,
  GapActionStatus,
  GapVerificationResult,
  GapActivity,
  GapActivityEvaluation,
  GapActivityStandard,
  GapArea,
  GapAssessment,
  GapAssessmentStats,
  GapAssessmentProcess,
  GapProcess,
  GapStandard,
  RiskPriority,
} from '../types/gap'

interface GapAssessmentFullData {
  assessment: GapAssessment | null
  evaluations: GapActivityEvaluation[]
  actions: GapAction[]
  processes: GapProcess[]
}

export interface GapStandardInput {
  code: string
  name: string
  version?: string | null
  issuing_body?: string | null
  description?: string | null
  url?: string | null
}

export interface GapProcessInput {
  code: string
  name: string
  description?: string | null
  order_index: number
}

export interface GapAreaInput {
  code: string
  name: string
  description?: string | null
  order_index: number
}

export interface GapActivityInput {
  code: string
  name: string
  description?: string | null
  operator?: string | null
  target_state?: string | null
  order_index: number
}

export interface GapActivityStandardLinkInput {
  standard_id: string
  specific_reference?: string | null
}

export interface GapAssessmentInput {
  title: string
  description?: string | null
  facility_name?: string | null
  department?: string | null
  assessor?: string | null
  assessment_date?: string | null
  total_activities: number
}

export interface GapActivityEvaluationInput {
  activity_id: string
  process_name_snapshot?: string | null
  area_name_snapshot?: string | null
  activity_name_snapshot?: string | null
  activity_code_snapshot?: string | null
}

export interface GapActivityEvaluationUpdateInput {
  current_state: string | null
  target_state_override: string | null
  gap_description: string | null
  compliance_status: ComplianceStatus
  risk_priority: RiskPriority
  notes: string | null
  evaluated_by?: string | null
  evaluated_at?: string | null
}

export interface GapActionInput {
  description: string
  responsible?: string | null
  priority: GapActionPriority
  status: GapActionStatus
  progress: number
  phase?: GapActionPhase | null
  planned_start_date?: string | null
  planned_end_date?: string | null
  notes?: string | null
}

export interface GapActionUpdateInput extends GapActionInput {}

export interface GapActionVerificationInput {
  verification_method?: string | null
  verification_result: Exclude<GapVerificationResult, 'pending'>
  verification_notes?: string | null
  verified_by?: string | null
}

export interface GapAreaWithActivities extends GapArea {
  activities: GapActivity[]
}

export interface GapProcessWithStructure extends GapProcess {
  areas: GapAreaWithActivities[]
  total_activities: number
}

const throwIfError = (error: unknown) => {
  if (error) throw error
}

const toDateKey = (value: Date) => value.toISOString().slice(0, 10)

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export const getGapAssessments = async (userId: string): Promise<GapAssessment[]> => {
  const { data, error } = await supabase
    .from('gap_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  throwIfError(error)
  return (data || []) as GapAssessment[]
}

export const getGapAssessmentById = async (
  id: string,
  userId: string,
): Promise<GapAssessment | null> => {
  const { data, error } = await supabase
    .from('gap_assessments')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  throwIfError(error)
  return data as GapAssessment | null
}

export const deleteGapAssessment = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('gap_assessments')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  throwIfError(error)
}

export const createGapAssessment = async (
  userId: string,
  payload: GapAssessmentInput,
): Promise<GapAssessment> => {
  const { data, error } = await supabase
    .from('gap_assessments')
    .insert({
      user_id: userId,
      title: payload.title,
      description: payload.description || null,
      facility_name: payload.facility_name || null,
      department: payload.department || null,
      assessor: payload.assessor || null,
      assessment_date: payload.assessment_date || null,
      status: 'draft',
      total_activities: payload.total_activities,
      compliant_count: 0,
      partial_count: 0,
      non_compliant_count: 0,
      not_evaluated_count: payload.total_activities,
      na_count: 0,
      compliance_percentage: 0,
    })
    .select('*')
    .single()

  throwIfError(error)
  return data as GapAssessment
}

export const updateGapAssessmentEvaluationCounts = async (
  id: string,
  userId: string,
  totalActivities: number,
): Promise<GapAssessment> => {
  const { data, error } = await supabase
    .from('gap_assessments')
    .update({
      total_activities: totalActivities,
      compliant_count: 0,
      partial_count: 0,
      non_compliant_count: 0,
      not_evaluated_count: totalActivities,
      na_count: 0,
      compliance_percentage: 0,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  throwIfError(error)
  return data as GapAssessment
}

export const updateGapAssessmentStats = async (
  id: string,
  userId: string,
  stats: GapAssessmentStats,
): Promise<GapAssessment> => {
  const { data, error } = await supabase
    .from('gap_assessments')
    .update({
      total_activities: stats.total_activities,
      compliant_count: stats.compliant_count,
      partial_count: stats.partial_count,
      non_compliant_count: stats.non_compliant_count,
      not_evaluated_count: stats.not_evaluated_count,
      na_count: stats.na_count,
      compliance_percentage: stats.compliance_percentage,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  throwIfError(error)
  return data as GapAssessment
}

export const createGapAssessmentProcess = async (
  userId: string,
  assessmentId: string,
  processId: string,
): Promise<GapAssessmentProcess> => {
  const { data, error } = await supabase
    .from('gap_assessment_processes')
    .insert({
      user_id: userId,
      assessment_id: assessmentId,
      process_id: processId,
    })
    .select('*')
    .single()

  throwIfError(error)
  return data as GapAssessmentProcess
}

export const createGapActivityEvaluationsForAssessment = async (
  userId: string,
  assessmentId: string,
  evaluations: GapActivityEvaluationInput[],
): Promise<GapActivityEvaluation[]> => {
  if (evaluations.length === 0) return []

  const { data, error } = await supabase
    .from('gap_activity_evaluations')
    .insert(
      evaluations.map((evaluation) => ({
        user_id: userId,
        assessment_id: assessmentId,
        activity_id: evaluation.activity_id,
        compliance_status: 'not_evaluated',
        risk_priority: 'medium',
        process_name_snapshot: evaluation.process_name_snapshot || null,
        area_name_snapshot: evaluation.area_name_snapshot || null,
        activity_name_snapshot: evaluation.activity_name_snapshot || null,
        activity_code_snapshot: evaluation.activity_code_snapshot || null,
      })),
    )
    .select('*')

  throwIfError(error)
  return (data || []) as GapActivityEvaluation[]
}

export const createGapActivityEvaluationForAssessment = async (
  userId: string,
  assessmentId: string,
  evaluation: GapActivityEvaluationInput,
): Promise<GapActivityEvaluation> => {
  const { data, error } = await supabase
    .from('gap_activity_evaluations')
    .insert({
      user_id: userId,
      assessment_id: assessmentId,
      activity_id: evaluation.activity_id,
      compliance_status: 'not_evaluated',
      risk_priority: 'medium',
      process_name_snapshot: evaluation.process_name_snapshot || null,
      area_name_snapshot: evaluation.area_name_snapshot || null,
      activity_name_snapshot: evaluation.activity_name_snapshot || null,
      activity_code_snapshot: evaluation.activity_code_snapshot || null,
    })
    .select('*')
    .single()

  throwIfError(error)
  return data as GapActivityEvaluation
}

export const getGapProcesses = async (userId: string): Promise<GapProcess[]> => {
  const { data, error } = await supabase
    .from('gap_processes')
    .select('*')
    .eq('user_id', userId)
    .order('order_index', { ascending: true })
    .order('name', { ascending: true })

  throwIfError(error)
  return (data || []) as GapProcess[]
}

export const getGapProcessesWithStructure = async (
  userId: string,
): Promise<GapProcessWithStructure[]> => {
  const processes = await getGapProcesses(userId)

  return Promise.all(
    processes.map(async (process) => {
      const areas = await getGapAreasByProcess(process.id, userId)
      const areasWithActivities = await Promise.all(
        areas.map(async (area) => {
          const activities = await getGapActivitiesByArea(area.id, userId)
          return {
            ...area,
            activities,
          }
        }),
      )

      return {
        ...process,
        areas: areasWithActivities,
        total_activities: areasWithActivities.reduce(
          (sum, area) => sum + area.activities.length,
          0,
        ),
      }
    }),
  )
}

export const getGapAssessmentProcessesWithStructure = async (
  assessmentId: string,
  userId: string,
): Promise<GapProcessWithStructure[]> => {
  const { data, error } = await supabase
    .from('gap_assessment_processes')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('user_id', userId)

  throwIfError(error)

  const assessmentProcesses = (data || []) as GapAssessmentProcess[]
  const processIds = new Set(assessmentProcesses.map((item) => item.process_id))
  if (processIds.size === 0) return []

  const processes = await getGapProcessesWithStructure(userId)
  return processes.filter((process) => processIds.has(process.id))
}

export const getGapProcessById = async (
  id: string,
  userId: string,
): Promise<GapProcess | null> => {
  const { data, error } = await supabase
    .from('gap_processes')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  throwIfError(error)
  return data as GapProcess | null
}

export const createGapProcess = async (
  userId: string,
  payload: GapProcessInput,
): Promise<GapProcess> => {
  const { data, error } = await supabase
    .from('gap_processes')
    .insert({
      ...payload,
      user_id: userId,
      is_template: false,
    })
    .select('*')
    .single()

  throwIfError(error)
  return data as GapProcess
}

export const updateGapProcess = async (
  id: string,
  userId: string,
  payload: GapProcessInput,
): Promise<GapProcess> => {
  const { data, error } = await supabase
    .from('gap_processes')
    .update({
      ...payload,
      is_template: false,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  throwIfError(error)
  return data as GapProcess
}

export const deleteGapProcess = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('gap_processes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  throwIfError(error)
}

export const getGapStandards = async (userId: string): Promise<GapStandard[]> => {
  const { data, error } = await supabase
    .from('gap_standards')
    .select('*')
    .eq('user_id', userId)
    .order('code', { ascending: true })
    .order('name', { ascending: true })

  throwIfError(error)
  return (data || []) as GapStandard[]
}

export const createGapStandard = async (
  userId: string,
  payload: GapStandardInput,
): Promise<GapStandard> => {
  const { data, error } = await supabase
    .from('gap_standards')
    .insert({
      ...payload,
      user_id: userId,
      is_template: false,
    })
    .select('*')
    .single()

  throwIfError(error)
  return data as GapStandard
}

export const updateGapStandard = async (
  id: string,
  userId: string,
  payload: GapStandardInput,
): Promise<GapStandard> => {
  const { data, error } = await supabase
    .from('gap_standards')
    .update({
      ...payload,
      is_template: false,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  throwIfError(error)
  return data as GapStandard
}

export const deleteGapStandard = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('gap_standards')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  throwIfError(error)
}

export const getGapAreasByProcess = async (
  processId: string,
  userId: string,
): Promise<GapArea[]> => {
  const { data, error } = await supabase
    .from('gap_areas')
    .select('*')
    .eq('process_id', processId)
    .eq('user_id', userId)
    .order('order_index', { ascending: true })
    .order('name', { ascending: true })

  throwIfError(error)
  return (data || []) as GapArea[]
}

export const createGapArea = async (
  userId: string,
  processId: string,
  payload: GapAreaInput,
): Promise<GapArea> => {
  const { data, error } = await supabase
    .from('gap_areas')
    .insert({
      ...payload,
      user_id: userId,
      process_id: processId,
    })
    .select('*')
    .single()

  throwIfError(error)
  return data as GapArea
}

export const updateGapArea = async (
  id: string,
  userId: string,
  payload: GapAreaInput,
): Promise<GapArea> => {
  const { data, error } = await supabase
    .from('gap_areas')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  throwIfError(error)
  return data as GapArea
}

export const deleteGapArea = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('gap_areas')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  throwIfError(error)
}

export const getGapActivitiesByArea = async (
  areaId: string,
  userId: string,
): Promise<GapActivity[]> => {
  const { data, error } = await supabase
    .from('gap_activities')
    .select('*')
    .eq('area_id', areaId)
    .eq('user_id', userId)
    .order('order_index', { ascending: true })
    .order('name', { ascending: true })

  throwIfError(error)
  return (data || []) as GapActivity[]
}

export const createGapActivity = async (
  userId: string,
  areaId: string,
  payload: GapActivityInput,
): Promise<GapActivity> => {
  const { data, error } = await supabase
    .from('gap_activities')
    .insert({
      ...payload,
      user_id: userId,
      area_id: areaId,
    })
    .select('*')
    .single()

  throwIfError(error)
  return data as GapActivity
}

export const updateGapActivity = async (
  id: string,
  userId: string,
  payload: GapActivityInput,
): Promise<GapActivity> => {
  const { data, error } = await supabase
    .from('gap_activities')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  throwIfError(error)
  return data as GapActivity
}

export const deleteGapActivity = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('gap_activities')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  throwIfError(error)
}

export const getGapActivityStandardsByActivity = async (
  activityId: string,
  userId: string,
): Promise<GapActivityStandard[]> => {
  const { data, error } = await supabase
    .from('gap_activity_standards')
    .select('*, standard:gap_standards(*)')
    .eq('activity_id', activityId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  throwIfError(error)
  return (data || []) as GapActivityStandard[]
}

export const getGapActivityStandardsForActivities = async (
  activityIds: string[],
  userId: string,
): Promise<GapActivityStandard[]> => {
  const uniqueActivityIds = [...new Set(activityIds)].filter(Boolean)
  if (uniqueActivityIds.length === 0) return []

  const { data, error } = await supabase
    .from('gap_activity_standards')
    .select('*, standard:gap_standards(*)')
    .eq('user_id', userId)
    .in('activity_id', uniqueActivityIds)
    .order('created_at', { ascending: true })

  throwIfError(error)
  return (data || []) as GapActivityStandard[]
}

export const replaceGapActivityStandards = async (
  activityId: string,
  userId: string,
  links: GapActivityStandardLinkInput[],
): Promise<GapActivityStandard[]> => {
  const { error: deleteError } = await supabase
    .from('gap_activity_standards')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_id', userId)

  throwIfError(deleteError)

  if (links.length > 0) {
    const { error: insertError } = await supabase
      .from('gap_activity_standards')
      .insert(
        links.map((link) => ({
          user_id: userId,
          activity_id: activityId,
          standard_id: link.standard_id,
          specific_reference: link.specific_reference || null,
        })),
      )

    throwIfError(insertError)
  }

  return getGapActivityStandardsByActivity(activityId, userId)
}

export const getGapEvaluationsByAssessment = async (
  assessmentId: string,
  userId: string,
): Promise<GapActivityEvaluation[]> => {
  const { data, error } = await supabase
    .from('gap_activity_evaluations')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('user_id', userId)
    .order('activity_code_snapshot', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  throwIfError(error)
  return (data || []) as GapActivityEvaluation[]
}

export const updateGapActivityEvaluation = async (
  id: string,
  userId: string,
  payload: GapActivityEvaluationUpdateInput,
): Promise<GapActivityEvaluation> => {
  const { data, error } = await supabase
    .from('gap_activity_evaluations')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  throwIfError(error)
  return data as GapActivityEvaluation
}

export const getGapActionsByAssessment = async (
  assessmentId: string,
  userId: string,
): Promise<GapAction[]> => {
  const { data, error } = await supabase
    .from('gap_actions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('user_id', userId)
    .order('planned_end_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  throwIfError(error)
  return (data || []) as GapAction[]
}

export const createGapAction = async (
  userId: string,
  assessmentId: string,
  evaluation: Pick<GapActivityEvaluation, 'id' | 'activity_id'>,
  payload: GapActionInput,
): Promise<GapAction> => {
  const { data, error } = await supabase
    .from('gap_actions')
    .insert({
      user_id: userId,
      assessment_id: assessmentId,
      activity_id: evaluation.activity_id,
      evaluation_id: evaluation.id,
      description: payload.description,
      responsible: payload.responsible || null,
      priority: payload.priority,
      status: payload.status,
      progress: payload.progress,
      phase: payload.phase || null,
      milestone: false,
      planned_start_date: payload.planned_start_date || null,
      planned_end_date: payload.planned_end_date || null,
      verification_result: 'pending',
      notes: payload.notes || null,
    })
    .select('*')
    .single()

  throwIfError(error)
  return data as GapAction
}

export const updateGapAction = async (
  id: string,
  userId: string,
  payload: GapActionUpdateInput,
): Promise<GapAction> => {
  const { data, error } = await supabase
    .from('gap_actions')
    .update({
      description: payload.description,
      responsible: payload.responsible || null,
      priority: payload.priority,
      status: payload.status,
      progress: payload.progress,
      phase: payload.phase || null,
      planned_start_date: payload.planned_start_date || null,
      planned_end_date: payload.planned_end_date || null,
      notes: payload.notes || null,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  throwIfError(error)
  return data as GapAction
}

export const deleteGapAction = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('gap_actions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  throwIfError(error)
}

export const createGapActionEvent = async (
  userId: string,
  action: Pick<GapAction, 'id' | 'assessment_id' | 'activity_id' | 'evaluation_id'>,
  eventType: GapActionEventType,
  description?: string | null,
): Promise<GapActionEvent> => {
  const { data, error } = await supabase
    .from('gap_action_events')
    .insert({
      user_id: userId,
      assessment_id: action.assessment_id,
      activity_id: action.activity_id,
      evaluation_id: action.evaluation_id,
      action_id: action.id,
      event_type: eventType,
      description: description || null,
      created_by: userId,
    })
    .select('*')
    .single()

  throwIfError(error)
  return data as GapActionEvent
}

export const getGapActionEventsByAction = async (
  actionId: string,
  userId: string,
): Promise<GapActionEvent[]> => {
  const { data, error } = await supabase
    .from('gap_action_events')
    .select('*')
    .eq('action_id', actionId)
    .eq('user_id', userId)
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false })

  throwIfError(error)
  return (data || []) as GapActionEvent[]
}

export const completeGapAction = async (
  userId: string,
  action: GapAction,
  payload: GapActionUpdateInput,
): Promise<GapAction> => {
  const today = new Date()
  const { data, error } = await supabase
    .from('gap_actions')
    .update({
      description: payload.description,
      responsible: payload.responsible || null,
      priority: payload.priority,
      status: 'completed',
      progress: payload.progress,
      phase: payload.phase || null,
      planned_start_date: payload.planned_start_date || null,
      planned_end_date: payload.planned_end_date || null,
      actual_end_date: action.actual_end_date || toDateKey(today),
      verification_due_date: action.verification_due_date || toDateKey(addDays(today, 30)),
      verification_result: 'pending',
      notes: payload.notes || null,
    })
    .eq('id', action.id)
    .eq('user_id', userId)
    .select('*')
    .single()

  throwIfError(error)
  const updatedAction = data as GapAction
  await createGapActionEvent(userId, updatedAction, 'completed', 'Azione completata. Verifica efficacia in attesa.')
  return updatedAction
}

export const verifyGapAction = async (
  userId: string,
  action: GapAction,
  payload: GapActionVerificationInput,
): Promise<GapAction> => {
  const status: GapActionStatus = payload.verification_result === 'ineffective'
    ? 'in_progress'
    : 'verified'
  const eventType: GapActionEventType = payload.verification_result === 'effective'
    ? 'verified_effective'
    : payload.verification_result === 'partially_effective'
      ? 'verified_partially'
      : 'verified_ineffective'

  const { data, error } = await supabase
    .from('gap_actions')
    .update({
      status,
      verified_at: new Date().toISOString(),
      verification_method: payload.verification_method || null,
      verification_result: payload.verification_result,
      verification_notes: payload.verification_notes || null,
      verified_by: payload.verified_by || null,
    })
    .eq('id', action.id)
    .eq('user_id', userId)
    .select('*')
    .single()

  throwIfError(error)
  const updatedAction = data as GapAction
  await createGapActionEvent(
    userId,
    updatedAction,
    eventType,
    payload.verification_notes || `Verifica efficacia: ${payload.verification_result}.`,
  )
  return updatedAction
}

export const getGapAssessmentFullData = async (
  assessmentId: string,
  userId: string,
): Promise<GapAssessmentFullData> => {
  const [assessment, evaluations, actions] = await Promise.all([
    getGapAssessmentById(assessmentId, userId),
    getGapEvaluationsByAssessment(assessmentId, userId),
    getGapActionsByAssessment(assessmentId, userId),
  ])

  const { data: assessmentProcessesData, error: assessmentProcessesError } = await supabase
    .from('gap_assessment_processes')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('user_id', userId)

  throwIfError(assessmentProcessesError)

  const assessmentProcesses = (assessmentProcessesData || []) as GapAssessmentProcess[]
  const processIds = assessmentProcesses.map((item) => item.process_id)
  const uniqueProcessIds = [...new Set(processIds)]

  if (uniqueProcessIds.length === 0) {
    return {
      assessment,
      evaluations,
      actions,
      processes: [],
    }
  }

  const { data: processesData, error: processesError } = await supabase
    .from('gap_processes')
    .select('*')
    .eq('user_id', userId)
    .in('id', uniqueProcessIds)
    .order('order_index', { ascending: true })
    .order('name', { ascending: true })

  throwIfError(processesError)

  return {
    assessment,
    evaluations,
    actions,
    processes: (processesData || []) as GapProcess[],
  }
}
