import { DEFAULT_SETTINGS } from "~/lib/settings";

export function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const LOCALE = "en-US";

function currencyFormatter(currency: string, options: Intl.NumberFormatOptions = {}) {
  try {
    return new Intl.NumberFormat(LOCALE, { style: "currency", currency, ...options });
  } catch {
    // Unknown or malformed code: fall back so a bad stored value never breaks rendering.
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: DEFAULT_SETTINGS.currency,
      ...options,
    });
  }
}

export function formatMoney(value: number, currency: string = DEFAULT_SETTINGS.currency): string {
  // Fraction digits intentionally follow the currency's own minor unit
  // (2 for USD/EUR, 0 for JPY, 3 for BHD) instead of a hardcoded 2.
  return currencyFormatter(currency).format(value);
}

export function formatMoneyCompact(
  value: number,
  currency: string = DEFAULT_SETTINGS.currency
): string {
  const abs = Math.abs(value);
  if (abs >= 10_000) {
    return currencyFormatter(currency, {
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
  }

  return formatMoney(value, currency);
}

export function currencySymbol(currency: string): string {
  const part = currencyFormatter(currency)
    .formatToParts(0)
    .find((item) => item.type === "currency");
  return part?.value ?? currency;
}

export type MoneyFormatter = {
  currency: string;
  format: (value: number) => string;
  formatCompact: (value: number) => string;
};

export function createMoneyFormatter(currency: string): MoneyFormatter {
  return {
    currency,
    format: (value) => formatMoney(value, currency),
    formatCompact: (value) => formatMoneyCompact(value, currency),
  };
}
