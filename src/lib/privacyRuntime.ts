import { PRIVACY_COPY } from '../config/privacy'
import type { PrivacyFinding } from './privacyDetector'

export interface PrivacyReviewRequest {
  tableName: string
  findings: PrivacyFinding[]
}

type PrivacyReviewHandler = (request: PrivacyReviewRequest) => Promise<boolean>

let reviewHandler: PrivacyReviewHandler | null = null
let exportWarningAcknowledged = false

export const registerPrivacyReviewHandler = (handler: PrivacyReviewHandler) => {
  reviewHandler = handler
  return () => {
    if (reviewHandler === handler) reviewHandler = null
  }
}

export const requestPrivacyReview = async (request: PrivacyReviewRequest) => {
  if (request.findings.length === 0) return true
  if (!reviewHandler) return false
  return reviewHandler(request)
}

export const isPrivacyReviewCancelled = (error: unknown) => {
  if (!error || typeof error !== 'object' || !('code' in error)) return false
  return error.code === 'PRIVACY_REVIEW_CANCELLED'
}

export const confirmExportPrivacy = () => {
  if (exportWarningAcknowledged || typeof window === 'undefined') return true
  const approved = window.confirm(`${PRIVACY_COPY.exportTitle}\n\n${PRIVACY_COPY.exportNotice}\n\nContinuare con l'export?`)
  if (approved) exportWarningAcknowledged = true
  return approved
}

export const resetExportPrivacyAcknowledgement = () => {
  exportWarningAcknowledged = false
}

export type PrivacyExportModule = 'FMEA' | 'RCA' | 'GAP' | 'GDPR'
export type PrivacyExportExtension = 'pdf' | 'xlsx' | 'png' | 'json'

export const createNeutralExportFileName = (
  module: PrivacyExportModule,
  date: Date,
  extension: PrivacyExportExtension,
  artifact?: string,
) => {
  const isoDate = date.toISOString().slice(0, 10)
  const safeArtifact = artifact
    ?.normalize('NFKD')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
  return `PhaRMA_T_${module}${safeArtifact ? `_${safeArtifact}` : ''}_${isoDate}.${extension}`
}
