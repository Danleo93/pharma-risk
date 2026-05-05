import type { RCAAssessmentStatus, RCASeverity } from '../types'
import type {
  ComplianceStatus,
  GapActionPhase,
  GapActionPriority,
  GapActionStatus,
  GapAssessmentStatus,
  GapVerificationResult,
  RiskPriority,
} from '../types/gap'

export type RCAActionStatus = 'planned' | 'in_progress' | 'completed'
export type RCAPriority = 'low' | 'medium' | 'high' | 'critical'
export type RootCauseStatus = 'candidate' | 'confirmed' | 'not_confirmed'
export type FMEAStatus = 'draft' | 'in_progress' | 'completed' | 'archived'
export type FMEAActionStatus = 'planned' | 'in_progress' | 'completed'
export type FMEARiskClass = 'Alta' | 'Media' | 'Bassa'

type RootCauseLike = {
  is_root_cause?: boolean | null
  root_cause_status?: RootCauseStatus | string | null
}

export const RCA_ASSESSMENT_STATUS_OPTIONS: { value: RCAAssessmentStatus; label: string }[] = [
  { value: 'draft', label: 'Bozza' },
  { value: 'in_progress', label: 'In corso' },
  { value: 'completed', label: 'Completato' },
  { value: 'archived', label: 'Archiviato' },
]

export const FMEA_ASSESSMENT_STATUS_OPTIONS: { value: FMEAStatus; label: string }[] = [
  { value: 'draft', label: 'Bozza' },
  { value: 'in_progress', label: 'In corso' },
  { value: 'completed', label: 'Completato' },
  { value: 'archived', label: 'Archiviato' },
]

export const RCA_ACTION_STATUS_OPTIONS: { value: RCAActionStatus; label: string }[] = [
  { value: 'planned', label: 'Pianificata' },
  { value: 'in_progress', label: 'In corso' },
  { value: 'completed', label: 'Completata' },
]

export const RCA_ACTION_STATUS_FILTER_OPTIONS: { value: 'all' | RCAActionStatus; label: string }[] = [
  { value: 'all', label: 'Tutte' },
  { value: 'planned', label: 'Pianificate' },
  { value: 'in_progress', label: 'In corso' },
  { value: 'completed', label: 'Completate' },
]

export const RCA_PRIORITY_OPTIONS: { value: '' | RCAPriority; label: string }[] = [
  { value: '', label: 'N/D' },
  { value: 'low', label: 'Bassa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Critica' },
]

export const GAP_ASSESSMENT_STATUS_OPTIONS: { value: GapAssessmentStatus; label: string }[] = [
  { value: 'draft', label: 'Bozza' },
  { value: 'in_progress', label: 'In corso' },
  { value: 'completed', label: 'Completato' },
  { value: 'archived', label: 'Archiviato' },
]

export const COMPLIANCE_STATUS_OPTIONS: { value: ComplianceStatus; label: string }[] = [
  { value: 'not_evaluated', label: 'Non valutata' },
  { value: 'non_compliant', label: 'Non conforme' },
  { value: 'partially_compliant', label: 'Parzialmente conforme' },
  { value: 'compliant', label: 'Conforme' },
]

export const RISK_PRIORITY_OPTIONS: { value: RiskPriority; label: string }[] = [
  { value: 'low', label: 'Bassa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
]

export const GAP_ACTION_STATUS_OPTIONS: { value: GapActionStatus; label: string }[] = [
  { value: 'not_started', label: 'Non avviata' },
  { value: 'planned', label: 'Pianificata' },
  { value: 'in_progress', label: 'In corso' },
  { value: 'blocked', label: 'Bloccata' },
  { value: 'completed', label: 'Completata' },
  { value: 'verified', label: 'Verificata' },
  { value: 'ineffective', label: 'Non efficace' },
]

export const GAP_ACTION_PRIORITY_OPTIONS: { value: GapActionPriority; label: string }[] = [
  { value: 'low', label: 'Bassa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Critica' },
]

export const GAP_ACTION_PHASE_OPTIONS: { value: GapActionPhase; label: string }[] = [
  { value: 'analysis', label: 'Analisi' },
  { value: 'planning', label: 'Pianificazione' },
  { value: 'implementation', label: 'Implementazione' },
  { value: 'training', label: 'Formazione' },
  { value: 'verification', label: 'Verifica' },
  { value: 'monitoring', label: 'Monitoraggio' },
  { value: 'closure', label: 'Chiusura' },
]

export const GAP_VERIFICATION_RESULT_OPTIONS: { value: GapVerificationResult; label: string }[] = [
  { value: 'pending', label: 'Da verificare' },
  { value: 'effective', label: 'Efficace' },
  { value: 'partially_effective', label: 'Parzialmente efficace' },
  { value: 'ineffective', label: 'Non efficace' },
]

export const RCA_METHODOLOGY_LABELS: Record<string, string> = {
  '5_whys': '5 Whys (legacy)',
  fishbone: 'Ishikawa',
  combined: 'Ishikawa + 5 Whys',
}

export const RCA_EVENT_TYPE_LABELS: Record<string, string> = {
  incident: 'Incidente',
  near_miss: 'Near miss',
  non_conformity: 'Non conformita',
  complaint: 'Reclamo',
  other: 'Altro',
}

export const getRCAAssessmentStatusLabel = (status: RCAAssessmentStatus | string | null | undefined) => {
  switch (status) {
    case 'draft':
      return 'Bozza'
    case 'in_progress':
      return 'In corso'
    case 'action_planned':
      return 'In corso'
    case 'completed':
      return 'Completato'
    case 'archived':
      return 'Archiviato'
    default:
      return 'Bozza'
  }
}

export const getRCAAssessmentStatusColor = (status: RCAAssessmentStatus | string | null | undefined) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700'
    case 'action_planned':
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-700'
    case 'archived':
      return 'bg-gray-100 text-gray-600'
    case 'draft':
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export const getGapAssessmentStatusLabel = (status: GapAssessmentStatus | string | null | undefined) => {
  switch (status) {
    case 'draft':
      return 'Bozza'
    case 'in_progress':
      return 'In corso'
    case 'completed':
      return 'Completato'
    case 'archived':
      return 'Archiviato'
    default:
      return 'Bozza'
  }
}

export const getGapAssessmentStatusColor = (status: GapAssessmentStatus | string | null | undefined) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700'
    case 'in_progress':
      return 'bg-teal-100 text-teal-700'
    case 'archived':
      return 'bg-slate-100 text-slate-600'
    case 'draft':
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export const getComplianceStatusLabel = (status: ComplianceStatus | string | null | undefined) => {
  switch (status) {
    case 'compliant':
      return 'Conforme'
    case 'partially_compliant':
      return 'Parzialmente conforme'
    case 'non_compliant':
      return 'Non conforme'
    case 'not_applicable':
      return 'Non applicabile'
    case 'not_evaluated':
    default:
      return 'Non valutata'
  }
}

export const getComplianceStatusColor = (status: ComplianceStatus | string | null | undefined) => {
  switch (status) {
    case 'compliant':
      return 'bg-emerald-100 text-emerald-700'
    case 'partially_compliant':
      return 'bg-amber-100 text-amber-800'
    case 'non_compliant':
      return 'bg-red-100 text-red-700'
    case 'not_applicable':
      return 'bg-slate-100 text-slate-600'
    case 'not_evaluated':
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export const getGapRiskPriorityLabel = (priority: RiskPriority | string | null | undefined) => {
  switch (priority) {
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

export const getGapRiskPriorityColor = (priority: RiskPriority | string | null | undefined) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700'
    case 'medium':
      return 'bg-amber-100 text-amber-800'
    case 'low':
      return 'bg-emerald-100 text-emerald-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export const getGapActionStatusLabel = (status: GapActionStatus | string | null | undefined) => {
  switch (status) {
    case 'not_started':
      return 'Non avviata'
    case 'planned':
      return 'Pianificata'
    case 'in_progress':
      return 'In corso'
    case 'blocked':
      return 'Bloccata'
    case 'completed':
      return 'Completata'
    case 'verified':
      return 'Verificata'
    case 'ineffective':
      return 'Non efficace'
    case 'closed':
      return 'Chiusa'
    default:
      return 'Pianificata'
  }
}

export const getGapActionStatusColor = (status: GapActionStatus | string | null | undefined) => {
  switch (status) {
    case 'verified':
    case 'closed':
      return 'bg-emerald-100 text-emerald-700'
    case 'completed':
      return 'bg-sky-100 text-sky-700'
    case 'in_progress':
      return 'bg-teal-100 text-teal-700'
    case 'blocked':
    case 'ineffective':
      return 'bg-red-100 text-red-700'
    case 'not_started':
      return 'bg-slate-100 text-slate-600'
    case 'planned':
    default:
      return 'bg-blue-100 text-blue-700'
  }
}

export const getGapActionPriorityLabel = (priority: GapActionPriority | string | null | undefined) => {
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

export const getGapActionPriorityColor = (priority: GapActionPriority | string | null | undefined) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-700'
    case 'high':
      return 'bg-orange-100 text-orange-700'
    case 'medium':
      return 'bg-amber-100 text-amber-800'
    case 'low':
      return 'bg-emerald-100 text-emerald-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export const getGapVerificationResultLabel = (result: GapVerificationResult | string | null | undefined) => {
  switch (result) {
    case 'effective':
      return 'Efficace'
    case 'partially_effective':
      return 'Parzialmente efficace'
    case 'ineffective':
      return 'Non efficace'
    case 'pending':
    default:
      return 'Da verificare'
  }
}

export const getGapVerificationResultColor = (result: GapVerificationResult | string | null | undefined) => {
  switch (result) {
    case 'effective':
      return 'bg-emerald-100 text-emerald-700'
    case 'partially_effective':
      return 'bg-amber-100 text-amber-800'
    case 'ineffective':
      return 'bg-red-100 text-red-700'
    case 'pending':
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

export const getRCASeverityLabel = (severity: RCASeverity | string | null | undefined) => {
  switch (severity) {
    case 'low':
      return 'Bassa'
    case 'medium':
      return 'Media'
    case 'high':
      return 'Alta'
    case 'critical':
      return 'Critica'
    default:
      return 'N/D'
  }
}

export const getRCASeverityColor = (severity: RCASeverity | string | null | undefined) => {
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

export const normalizeRCAActionStatus = (status: string | null | undefined): RCAActionStatus => {
  if (status === 'completed') return 'completed'
  if (status === 'in_progress') return 'in_progress'
  return 'planned'
}

export const getRCAActionStatusLabel = (status: string | null | undefined) => {
  switch (normalizeRCAActionStatus(status)) {
    case 'completed':
      return 'Completata'
    case 'in_progress':
      return 'In corso'
    default:
      return 'Pianificata'
  }
}

export const getRCAActionStatusColor = (status: string | null | undefined) => {
  switch (normalizeRCAActionStatus(status)) {
    case 'completed':
      return 'bg-green-100 text-green-700'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-blue-100 text-blue-700'
  }
}

export const getRCAPriorityLabel = (priority: RCAPriority | string | null | undefined) => {
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

export const getRCAPriorityColor = (priority: RCAPriority | string | null | undefined) => {
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

export const getEffectiveRootCauseStatus = (cause: RootCauseLike | null | undefined): RootCauseStatus | null => {
  if (!cause?.is_root_cause) return null
  if (cause.root_cause_status === 'confirmed') return 'confirmed'
  if (cause.root_cause_status === 'not_confirmed') return 'not_confirmed'
  return 'candidate'
}

export const getRootCauseStatusLabel = (
  causeOrStatus: RootCauseLike | RootCauseStatus | string | null | undefined,
  fallback: string | null = null,
) => {
  const status = typeof causeOrStatus === 'string'
    ? causeOrStatus
    : getEffectiveRootCauseStatus(causeOrStatus)

  if (status === 'confirmed') return 'Root Cause confermata'
  if (status === 'not_confirmed') return 'Non confermata'
  if (status === 'candidate') return 'Candidata Root Cause'
  return fallback
}

export const getRootCauseStatusColor = (causeOrStatus: RootCauseLike | RootCauseStatus | string | null | undefined) => {
  const status = typeof causeOrStatus === 'string'
    ? causeOrStatus
    : getEffectiveRootCauseStatus(causeOrStatus)

  if (status === 'confirmed') return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  if (status === 'not_confirmed') return 'bg-slate-100 text-slate-600 border border-slate-200'
  if (status === 'candidate') return 'bg-red-100 text-red-700 border border-red-200'
  return ''
}

export const getFMEAAssessmentStatusLabel = (status: FMEAStatus | string | null | undefined) => {
  switch (status) {
    case 'completed':
      return 'Completato'
    case 'in_progress':
      return 'In corso'
    case 'archived':
      return 'Archiviato'
    default:
      return 'Bozza'
  }
}

export const getFMEAAssessmentStatusColor = (status: FMEAStatus | string | null | undefined) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-700'
    case 'archived':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export const getFMEAActionStatusLabel = (status: FMEAActionStatus | string | null | undefined) => {
  switch (status) {
    case 'completed':
      return 'Completata'
    case 'in_progress':
      return 'In Corso'
    default:
      return 'Pianificata'
  }
}

export const getFMEAActionStatusColor = (status: FMEAActionStatus | string | null | undefined) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-blue-100 text-blue-700'
  }
}

export const getFMEARiskClassColor = (riskClass: FMEARiskClass | string | null | undefined) => {
  switch (riskClass) {
    case 'Alta':
      return 'bg-red-100 text-red-700'
    case 'Media':
      return 'bg-yellow-100 text-yellow-700'
    case 'Bassa':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}
