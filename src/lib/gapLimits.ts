export const GAP_ASSESSMENT_ACTIVITY_WARNING = 400
export const GAP_ASSESSMENT_ACTIVITY_HARD_LIMIT = 600

export const GAP_LIBRARY_ACTIVITY_WARNING = 1000
export const GAP_LIBRARY_ACTIVITY_HARD_LIMIT = 1200

export const GAP_STANDARDS_WARNING = 400
export const GAP_STANDARDS_HARD_LIMIT = 500

export const GAP_STANDARDS_PER_ACTIVITY_WARNING = 5
export const GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT = 5

export const GAP_ACTIONS_PER_ASSESSMENT_WARNING = 150
export const GAP_ACTIONS_PER_ASSESSMENT_HARD_LIMIT = 200

export const GAP_PDF_EXPORT_WARNING_EVALUATIONS = 300

export const isGapWarningLimitReached = (value: number, warningLimit: number) =>
  value > warningLimit

export const isGapHardLimitReached = (value: number, hardLimit: number) =>
  value >= hardLimit

export const isGapHardLimitExceeded = (value: number, hardLimit: number) =>
  value > hardLimit
