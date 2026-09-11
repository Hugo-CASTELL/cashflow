export const BUDGET_DISPLAYS = ['percent', 'currency'] as const
export type BudgetDisplay = (typeof BUDGET_DISPLAYS)[number]

export const CHART_TYPES = ['donut', 'pie', 'bar'] as const
export type ChartType = (typeof CHART_TYPES)[number]

export const DEFAULT_CURRENCY = 'USD'
export const DEFAULT_BUDGET_DISPLAY: BudgetDisplay = 'percent'
export const DEFAULT_CHART_TYPE: ChartType = 'donut'

export interface AccountSettings {
  currency: string
  budget_display: BudgetDisplay
  chart_type: ChartType
}

// ISO 4217 codes are exactly three ASCII letters. Intl.NumberFormat accepts any
// well-formed code, so we only enforce the shape rather than a fixed list.
const CURRENCY_PATTERN = /^[A-Z]{3}$/

export function parseCurrency (value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const code = value.trim().toUpperCase()
  return CURRENCY_PATTERN.test(code) ? code : null
}

export function parseBudgetDisplay (value: unknown): BudgetDisplay | null {
  return typeof value === 'string' && (BUDGET_DISPLAYS as readonly string[]).includes(value)
    ? (value as BudgetDisplay)
    : null
}

export function parseChartType (value: unknown): ChartType | null {
  return typeof value === 'string' && (CHART_TYPES as readonly string[]).includes(value)
    ? (value as ChartType)
    : null
}
