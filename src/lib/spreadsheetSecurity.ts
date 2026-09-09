const SPREADSHEET_FORMULA_PREFIX = /^[\t\r\n ]*[=+\-@]/

export const sanitizeSpreadsheetCell = (value: unknown): unknown => {
  if (typeof value !== 'string') return value
  return SPREADSHEET_FORMULA_PREFIX.test(value) ? `'${value}` : value
}

export const sanitizeSpreadsheetRows = (rows: unknown[][]): unknown[][] => (
  rows.map((row) => row.map(sanitizeSpreadsheetCell))
)

export const sanitizeSpreadsheetRecords = <T extends Record<string, unknown>>(records: T[]): T[] => (
  records.map((record) => Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, sanitizeSpreadsheetCell(value)]),
  ) as T)
)
