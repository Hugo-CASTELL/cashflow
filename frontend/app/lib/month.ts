const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function parseMonthParam(value: string | null | undefined): string {
  if (value && MONTH_PATTERN.test(value)) {
    return value;
  }

  return currentMonth();
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const next = new Date(year, monthIndex - 1 + delta, 1);
  return currentMonth(next);
}

export function formatMonthLabel(month: string, mode: "long" | "short" = "long"): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(year, monthIndex - 1, 1).toLocaleDateString(undefined, {
    month: mode,
    year: "numeric",
  });
}

export function defaultDateForMonth(month: string, now = new Date()): string {
  if (month === currentMonth(now)) {
    return toIsoDate(now);
  }

  const [year, monthIndex] = month.split("-").map(Number);
  const lastDay = new Date(year, monthIndex, 0).getDate();
  const day = Math.min(now.getDate(), lastDay);
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isInMonth(date: string, month: string): boolean {
  return date.startsWith(month);
}

export function monthSearch(month: string): string {
  return month === currentMonth() ? "" : `?month=${month}`;
}

export function monthHref(pathname: string, month: string): string {
  return `${pathname}${monthSearch(month)}`;
}
