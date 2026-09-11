import type { PublicAccount } from "~/lib/api";

export const BUDGET_DISPLAYS = ["percent", "currency"] as const;
export type BudgetDisplay = (typeof BUDGET_DISPLAYS)[number];

export const CHART_TYPES = ["donut", "pie", "bar"] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export type Settings = {
  currency: string;
  budgetDisplay: BudgetDisplay;
  chartType: ChartType;
};

export const DEFAULT_SETTINGS: Settings = {
  currency: "USD",
  budgetDisplay: "percent",
  chartType: "donut",
};

export const CURRENCIES: ReadonlyArray<{ code: string; label: string }> = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "NZD", label: "New Zealand Dollar" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "HKD", label: "Hong Kong Dollar" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "KRW", label: "South Korean Won" },
  { code: "INR", label: "Indian Rupee" },
  { code: "BRL", label: "Brazilian Real" },
  { code: "MXN", label: "Mexican Peso" },
  { code: "ZAR", label: "South African Rand" },
  { code: "SEK", label: "Swedish Krona" },
  { code: "NOK", label: "Norwegian Krone" },
  { code: "DKK", label: "Danish Krone" },
  { code: "PLN", label: "Polish Złoty" },
  { code: "CZK", label: "Czech Koruna" },
  { code: "HUF", label: "Hungarian Forint" },
  { code: "TRY", label: "Turkish Lira" },
];

export const BUDGET_DISPLAY_OPTIONS: ReadonlyArray<{
  value: BudgetDisplay;
  label: string;
  description: string;
}> = [
  {
    value: "percent",
    label: "Percentage",
    description: "Show how much of each budget is used, e.g. 64%.",
  },
  {
    value: "currency",
    label: "Currency",
    description: "Show what is left of each budget, e.g. $120 left.",
  },
];

export const CHART_TYPE_OPTIONS: ReadonlyArray<{
  value: ChartType;
  label: string;
  description: string;
}> = [
  { value: "donut", label: "Donut", description: "Ring with the month total in the middle." },
  { value: "pie", label: "Pie", description: "Full circle split by category." },
  { value: "bar", label: "Bars", description: "Horizontal bars, largest spend first." },
];

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export function isBudgetDisplay(value: unknown): value is BudgetDisplay {
  return typeof value === "string" && (BUDGET_DISPLAYS as readonly string[]).includes(value);
}

export function isChartType(value: unknown): value is ChartType {
  return typeof value === "string" && (CHART_TYPES as readonly string[]).includes(value);
}

export function normalizeCurrency(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_SETTINGS.currency;
  }

  const code = value.trim().toUpperCase();
  return CURRENCY_PATTERN.test(code) ? code : DEFAULT_SETTINGS.currency;
}

export function settingsFromAccount(account: PublicAccount | null | undefined): Settings {
  if (!account) {
    return DEFAULT_SETTINGS;
  }

  return {
    currency: normalizeCurrency(account.currency),
    budgetDisplay: isBudgetDisplay(account.budget_display)
      ? account.budget_display
      : DEFAULT_SETTINGS.budgetDisplay,
    chartType: isChartType(account.chart_type) ? account.chart_type : DEFAULT_SETTINGS.chartType,
  };
}
