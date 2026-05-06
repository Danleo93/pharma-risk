export type ComplianceStatus =
  | 'not_evaluated'
  | 'not_applicable'
  | 'non_compliant'
  | 'partially_compliant'
  | 'compliant'

export type RiskPriority = 'low' | 'medium' | 'high'

export type GapAssessmentStatus = 'draft' | 'in_progress' | 'completed' | 'archived'

export type GapActionStatus =
  | 'not_started'
  | 'planned'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'verified'
  | 'ineffective'
  | 'closed'

export type GapActionPriority = 'low' | 'medium' | 'high' | 'critical'

export type GapActionPhase =
  | 'analysis'
  | 'planning'
  | 'implementation'
  | 'training'
  | 'verification'
  | 'monitoring'
  | 'closure'

export type GapVerificationResult = 'pending' | 'effective' | 'partially_effective' | 'ineffective'

export type GapActionEventType =
  | 'created'
  | 'assigned'
  | 'started'
  | 'blocked'
  | 'unblocked'
  | 'completed'
  | 'verification_pending'
  | 'verified_effective'
  | 'verified_partially'
  | 'verified_ineffective'
  | 'verification_failed'
  | 'reopened'
  | 'closed'
  | 'due_date_changed'
  | 'progress_updated'
  | 'note_added'

export type GapLinkedType =
  | 'fmea_assessment'
  | 'fmea_risk'
  | 'fmea_action'
  | 'rca_assessment'
  | 'rca_cause'
  | 'rca_action'
  | 'document'
  | 'external'

export type GapLibrarySourceType = 'library' | 'assessment_only'

export interface GapProcess {
  id: string
  user_id: string
  code: string
  name: string
  description: string | null
  order_index: number
  is_template: boolean
  created_at: string
  updated_at: string
  areas?: GapArea[]
}

export interface GapArea {
  id: string
  user_id: string
  process_id: string
  code: string
  name: string
  description: string | null
  order_index: number
  source_type: GapLibrarySourceType
  created_in_assessment_id: string | null
  created_at: string
  updated_at: string
  process?: GapProcess
  activities?: GapActivity[]
}

export interface GapActivity {
  id: string
  user_id: string
  area_id: string
  code: string
  name: string
  description: string | null
  operator: string | null
  target_state: string | null
  order_index: number
  source_type: GapLibrarySourceType
  created_in_assessment_id: string | null
  created_at: string
  updated_at: string
  area?: GapArea
  standards?: GapActivityStandard[]
  evaluations?: GapActivityEvaluation[]
}

export interface GapStandard {
  id: string
  user_id: string
  code: string
  name: string
  version: string | null
  issuing_body: string | null
  description: string | null
  url: string | null
  is_template: boolean
  is_mandatory: boolean
  application_scope: string | null
  source_type: GapLibrarySourceType
  created_in_assessment_id: string | null
  created_at: string
  updated_at: string
}

export interface GapActivityStandard {
  id: string
  user_id: string
  activity_id: string
  standard_id: string
  specific_reference: string | null
  created_at: string
  activity?: GapActivity
  standard?: GapStandard
}

export interface GapAssessment {
  id: string
  user_id: string
  title: string
  description: string | null
  facility_name: string | null
  department: string | null
  assessor: string | null
  assessment_date: string | null
  status: GapAssessmentStatus
  total_activities: number
  compliant_count: number
  partial_count: number
  non_compliant_count: number
  not_evaluated_count: number
  na_count: number
  compliance_percentage: number
  created_at: string
  updated_at: string
  processes?: GapAssessmentProcess[]
  evaluations?: GapActivityEvaluation[]
  actions?: GapAction[]
}

export interface GapAssessmentProcess {
  id: string
  user_id: string
  assessment_id: string
  process_id: string
  created_at: string
  assessment?: GapAssessment
  process?: GapProcess
}

export interface GapActivityEvaluation {
  id: string
  user_id: string
  assessment_id: string
  activity_id: string
  current_state: string | null
  target_state_override: string | null
  gap_description: string | null
  compliance_status: ComplianceStatus
  risk_priority: RiskPriority
  process_name_snapshot: string | null
  area_name_snapshot: string | null
  activity_name_snapshot: string | null
  activity_code_snapshot: string | null
  notes: string | null
  evaluated_by: string | null
  evaluated_at: string | null
  created_at: string
  updated_at: string
  assessment?: GapAssessment
  activity?: GapActivity
  actions?: GapAction[]
}

export interface GapAction {
  id: string
  user_id: string
  assessment_id: string
  activity_id: string
  evaluation_id: string
  description: string
  responsible: string | null
  priority: GapActionPriority
  status: GapActionStatus
  progress: number
  phase: GapActionPhase | null
  milestone: boolean
  depends_on_action_id: string | null
  planned_start_date: string | null
  planned_end_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null
  verification_due_date: string | null
  verified_at: string | null
  verification_method: string | null
  verification_result: GapVerificationResult
  verification_notes: string | null
  verified_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
  assessment?: GapAssessment
  activity?: GapActivity
  evaluation?: GapActivityEvaluation
  depends_on_action?: GapAction
  events?: GapActionEvent[]
}

export interface GapActionEvent {
  id: string
  user_id: string
  assessment_id: string
  activity_id: string
  evaluation_id: string | null
  action_id: string
  event_type: GapActionEventType
  event_date: string
  description: string | null
  created_by: string | null
  created_at: string
  assessment?: GapAssessment
  activity?: GapActivity
  evaluation?: GapActivityEvaluation
  action?: GapAction
}

export interface GapLink {
  id: string
  user_id: string
  assessment_id: string | null
  activity_id: string | null
  evaluation_id: string | null
  linked_type: GapLinkedType
  linked_id: string
  notes: string | null
  created_at: string
  assessment?: GapAssessment
  activity?: GapActivity
  evaluation?: GapActivityEvaluation
}

export interface GapAssessmentStats {
  total_activities: number
  compliant_count: number
  partial_count: number
  non_compliant_count: number
  not_evaluated_count: number
  na_count: number
  compliance_percentage: number
}

export interface GapProcessCompliance {
  process_name: string
  total: number
  evaluated: number
  compliance_percentage: number
}

export interface GapAreaCompliance {
  area_name: string
  process_name: string | null
  total: number
  evaluated: number
  compliance_percentage: number
}

export interface GapBurndownPoint {
  date: string
  open: number
  overdue: number
  completed: number
  verified: number
}
