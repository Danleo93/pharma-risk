import type {
  ComplianceStatus,
  GapAction,
  GapActivityEvaluation,
  GapAreaCompliance,
  GapAssessmentStats,
  GapBurndownPoint,
  GapProcessCompliance,
} from '../types/gap'

type EvaluationLike = Pick<
  GapActivityEvaluation,
  | 'compliance_status'
  | 'process_name_snapshot'
  | 'area_name_snapshot'
>

type ActionLike = Pick<
  GapAction,
  | 'status'
  | 'planned_end_date'
  | 'actual_end_date'
  | 'verified_at'
>

const complianceScores: Partial<Record<ComplianceStatus, number>> = {
  compliant: 1,
  partially_compliant: 0.5,
  non_compliant: 0,
}

const emptyStatusCounts: Record<ComplianceStatus, number> = {
  not_evaluated: 0,
  not_applicable: 0,
  non_compliant: 0,
  partially_compliant: 0,
  compliant: 0,
}

const toDateKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  return date.toISOString().split('T')[0]
}

const compareDateKeys = (a: string, b: string) => a.localeCompare(b)

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export const countEvaluationsByStatus = (
  evaluations: Array<Pick<GapActivityEvaluation, 'compliance_status'>>,
) => {
  return evaluations.reduce<Record<ComplianceStatus, number>>(
    (counts, evaluation) => ({
      ...counts,
      [evaluation.compliance_status]: counts[evaluation.compliance_status] + 1,
    }),
    { ...emptyStatusCounts },
  )
}

export const calculateCompliancePercentage = (
  evaluations: Array<Pick<GapActivityEvaluation, 'compliance_status'>>,
) => {
  const scorableEvaluations = evaluations.filter((evaluation) =>
    Object.prototype.hasOwnProperty.call(complianceScores, evaluation.compliance_status),
  )

  if (scorableEvaluations.length === 0) return 0

  const totalScore = scorableEvaluations.reduce(
    (sum, evaluation) => sum + (complianceScores[evaluation.compliance_status] ?? 0),
    0,
  )

  return Math.round((totalScore / scorableEvaluations.length) * 100)
}

export const aggregateAssessmentStats = (
  evaluations: Array<Pick<GapActivityEvaluation, 'compliance_status'>>,
): GapAssessmentStats => {
  const counts = countEvaluationsByStatus(evaluations)

  return {
    total_activities: evaluations.length,
    compliant_count: counts.compliant,
    partial_count: counts.partially_compliant,
    non_compliant_count: counts.non_compliant,
    not_evaluated_count: counts.not_evaluated,
    na_count: counts.not_applicable,
    compliance_percentage: calculateCompliancePercentage(evaluations),
  }
}

export const calculateProcessCompliance = (
  evaluations: EvaluationLike[],
): GapProcessCompliance[] => {
  const groups = evaluations.reduce<Record<string, EvaluationLike[]>>((acc, evaluation) => {
    const processName = evaluation.process_name_snapshot || 'Processo non specificato'
    acc[processName] = [...(acc[processName] || []), evaluation]
    return acc
  }, {})

  return Object.entries(groups)
    .map(([processName, processEvaluations]) => ({
      process_name: processName,
      total: processEvaluations.length,
      evaluated: processEvaluations.filter((evaluation) =>
        Object.prototype.hasOwnProperty.call(complianceScores, evaluation.compliance_status),
      ).length,
      compliance_percentage: calculateCompliancePercentage(processEvaluations),
    }))
    .sort((a, b) => a.process_name.localeCompare(b.process_name))
}

export const calculateAreaCompliance = (
  evaluations: EvaluationLike[],
): GapAreaCompliance[] => {
  const groups = evaluations.reduce<Record<string, EvaluationLike[]>>((acc, evaluation) => {
    const processName = evaluation.process_name_snapshot || 'Processo non specificato'
    const areaName = evaluation.area_name_snapshot || 'Area non specificata'
    const key = `${processName}::${areaName}`
    acc[key] = [...(acc[key] || []), evaluation]
    return acc
  }, {})

  return Object.entries(groups)
    .map(([key, areaEvaluations]) => {
      const [processName, areaName] = key.split('::')
      return {
        area_name: areaName,
        process_name: processName,
        total: areaEvaluations.length,
        evaluated: areaEvaluations.filter((evaluation) =>
          Object.prototype.hasOwnProperty.call(complianceScores, evaluation.compliance_status),
        ).length,
        compliance_percentage: calculateCompliancePercentage(areaEvaluations),
      }
    })
    .sort((a, b) => `${a.process_name || ''}${a.area_name}`.localeCompare(`${b.process_name || ''}${b.area_name}`))
}

export const isGapActionOverdue = (
  action: Pick<GapAction, 'status' | 'planned_end_date'>,
  referenceDate: Date = new Date(),
) => {
  if (!action.planned_end_date) return false
  if (action.status === 'completed' || action.status === 'verified' || action.status === 'closed') return false

  return action.planned_end_date < toDateKey(referenceDate)
}

export const calculateBurndownData = (
  actions: ActionLike[],
  startDate?: string,
  endDate?: string,
): GapBurndownPoint[] => {
  if (actions.length === 0 && !startDate && !endDate) return []

  const actionDates = actions.flatMap((action) => [
    action.planned_end_date,
    action.actual_end_date,
    action.verified_at ? toDateKey(action.verified_at) : null,
  ]).filter(Boolean) as string[]

  const minDateKey = startDate || actionDates.sort(compareDateKeys)[0] || toDateKey(new Date())
  const maxDateKey = endDate || actionDates.sort(compareDateKeys)[actionDates.length - 1] || minDateKey
  const minDate = new Date(minDateKey)
  const maxDate = new Date(maxDateKey)

  const points: GapBurndownPoint[] = []
  for (let current = minDate; current <= maxDate; current = addDays(current, 1)) {
    const dateKey = toDateKey(current)
    const completed = actions.filter((action) =>
      Boolean(action.actual_end_date) && action.actual_end_date! <= dateKey,
    ).length
    const verified = actions.filter((action) =>
      Boolean(action.verified_at) && toDateKey(action.verified_at!) <= dateKey,
    ).length
    const overdue = actions.filter((action) =>
      Boolean(action.planned_end_date) &&
      action.planned_end_date! < dateKey &&
      !['completed', 'verified', 'closed'].includes(action.status),
    ).length
    const open = actions.length - actions.filter((action) =>
      ['verified', 'closed'].includes(action.status) ||
      (Boolean(action.actual_end_date) && action.actual_end_date! <= dateKey),
    ).length

    points.push({
      date: dateKey,
      open,
      overdue,
      completed,
      verified,
    })
  }

  return points
}
