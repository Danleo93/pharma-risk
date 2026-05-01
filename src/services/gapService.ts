import { supabase } from '../lib/supabase'
import type {
  GapAction,
  GapActivity,
  GapActivityEvaluation,
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
