import {
  PRIVACY_FIELDS_BY_TABLE,
  PRIVACY_PATTERN_LABELS,
} from '../config/privacy'

export type PrivacyFindingKind = keyof typeof PRIVACY_PATTERN_LABELS

export interface PrivacyFinding {
  kind: PrivacyFindingKind
  field: string
  fieldLabel: string
  count: number
}

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu
const fiscalCodeCandidatePattern = /\b[A-Z]{6}[0-9]{2}[A-EHLMPRST][0-9]{2}[A-Z][0-9]{3}[A-Z]\b/giu
const phoneCandidatePattern = /(?<!\d)(?:(?:\+39|0039)[\s.-]*)?(?:3\d{2}|0\d{1,4})(?:[\s./-]*\d){6,8}(?!\d)/gu

const oddValues: Record<string, number> = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21,
  K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14,
  U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
}

const evenValues: Record<string, number> = Object.fromEntries(
  [...'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((character) => [
    character,
    /\d/.test(character) ? Number(character) : character.charCodeAt(0) - 65,
  ]),
)

export const isPlausibleItalianFiscalCode = (candidate: string) => {
  const normalized = candidate.normalize('NFKC').toUpperCase()
  if (!/^[A-Z]{6}[0-9]{2}[A-EHLMPRST][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(normalized)) {
    return false
  }

  const controlSum = [...normalized.slice(0, 15)].reduce((sum, character, index) => (
    sum + (index % 2 === 0 ? oddValues[character] : evenValues[character])
  ), 0)
  return String.fromCharCode(65 + (controlSum % 26)) === normalized[15]
}

const countMatches = (text: string, pattern: RegExp) => [...text.matchAll(pattern)].length

const countPlausibleFiscalCodes = (text: string) => (
  [...text.matchAll(fiscalCodeCandidatePattern)]
    .map((match) => match[0])
    .filter(isPlausibleItalianFiscalCode)
    .length
)

const countPlausiblePhones = (text: string) => (
  [...text.matchAll(phoneCandidatePattern)]
    .map((match) => {
      const digits = match[0].replace(/\D/g, '').replace(/^0039/, '')
      return /^39(?:0|3)/.test(digits) && digits.length >= 10 ? digits.slice(2) : digits
    })
    .filter((digits) => (
      (digits.startsWith('3') && digits.length === 10)
      || (digits.startsWith('0') && digits.length >= 8 && digits.length <= 11)
    ))
    .length
)

export const detectPrivacyPatterns = (
  value: string,
  field = 'value',
  fieldLabel = 'Campo',
): PrivacyFinding[] => {
  const normalized = value.normalize('NFKC')
  const counts: Record<PrivacyFindingKind, number> = {
    email: countMatches(normalized, emailPattern),
    fiscal_code: countPlausibleFiscalCodes(normalized),
    phone: countPlausiblePhones(normalized),
  }

  return (Object.entries(counts) as [PrivacyFindingKind, number][])
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => ({ kind, field, fieldLabel, count }))
}

const asRows = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
  }
  return payload && typeof payload === 'object' ? [payload as Record<string, unknown>] : []
}

export const scanPrivacyPayload = (tableName: string, payload: unknown): PrivacyFinding[] => {
  const fields = PRIVACY_FIELDS_BY_TABLE[tableName]
  if (!fields) return []

  const merged = new Map<string, PrivacyFinding>()
  for (const row of asRows(payload)) {
    for (const [field, fieldLabel] of Object.entries(fields)) {
      const value = row[field]
      if (typeof value !== 'string' || !value.trim()) continue
      for (const finding of detectPrivacyPatterns(value, field, fieldLabel)) {
        const key = `${finding.field}:${finding.kind}`
        const current = merged.get(key)
        merged.set(key, current
          ? { ...current, count: current.count + finding.count }
          : finding)
      }
    }
  }
  return [...merged.values()]
}
