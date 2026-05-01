import { supabase } from '../lib/supabase'
import type {
  GapAction,
  GapActivity,
  GapActivityEvaluation,
  GapActivityStandard,
  GapArea,
  GapAssessment,
  GapAssessmentProcess,
  GapProcess,
  GapStandard,
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

const throwIfError = (error: unknown) => {
  if (error) throw error
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
