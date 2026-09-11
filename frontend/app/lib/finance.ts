import type { Category, Transaction } from "~/lib/api";
import { colorForCategory } from "~/lib/colors";
import { isInMonth } from "~/lib/month";
import { parseMoney, type MoneyFormatter } from "~/lib/money";
import type { BudgetDisplay } from "~/lib/settings";

export type CategorySpend = {
  category: Category;
  spent: number;
  budget: number | null;
  color: string;
  ratio: number | null;
  overBudget: boolean;
};

export function collectDescendantIds(
  categories: Category[],
  id: number
): Set<number> {
  const ids = new Set<number>([id]);
  for (const child of categories.filter((category) => category.parent_id === id)) {
    for (const descendantId of collectDescendantIds(categories, child.id)) {
      ids.add(descendantId);
    }
  }
  return ids;
}

export function monthTransactions(
  transactions: Transaction[],
  month: string
): Transaction[] {
  return transactions.filter((transaction) => isInMonth(transaction.date, month));
}

export function directSpendByCategory(
  transactions: Transaction[],
  month: string
): Map<number, number> {
  const totals = new Map<number, number>();

  for (const transaction of monthTransactions(transactions, month)) {
    const amount = parseMoney(transaction.amount);
    totals.set(transaction.category_id, (totals.get(transaction.category_id) ?? 0) + amount);
  }

  return totals;
}

export function rolledUpSpend(
  categories: Category[],
  transactions: Transaction[],
  month: string
): Map<number, number> {
  const direct = directSpendByCategory(transactions, month);
  const rolled = new Map<number, number>();

  for (const category of categories) {
    const ids = collectDescendantIds(categories, category.id);
    let total = 0;
    for (const id of ids) {
      total += direct.get(id) ?? 0;
    }
    rolled.set(category.id, total);
  }

  return rolled;
}

export function topLevelCategories(categories: Category[]): Category[] {
  const hasParents = categories.some((category) => category.parent_id !== null);
  if (!hasParents) {
    return categories;
  }

  return categories.filter((category) => category.parent_id === null);
}

export function categorySpendList(
  categories: Category[],
  transactions: Transaction[],
  month: string
): CategorySpend[] {
  const spend = rolledUpSpend(categories, transactions, month);

  return topLevelCategories(categories)
    .map((category) => {
      const spent = spend.get(category.id) ?? 0;
      const budget = category.monthly_budget == null ? null : parseMoney(category.monthly_budget);
      const ratio = budget != null && budget > 0 ? spent / budget : budget === 0 ? (spent > 0 ? 1 : 0) : null;

      return {
        category,
        spent,
        budget,
        color: colorForCategory(category.id),
        ratio,
        overBudget: budget != null && spent > budget,
      };
    })
    .sort((a, b) => b.spent - a.spent || a.category.title.localeCompare(b.category.title));
}

export type BudgetStatus = {
  label: string;
  over: boolean;
};

/**
 * Short label describing budget progress, either as a percentage of the
 * budget used ("64%", "120% over") or as the amount left in the account's
 * currency ("$120 left", "$20 over"). Returns null when there is no budget.
 */
export function budgetStatus(
  { spent, budget, ratio }: { spent: number; budget: number | null; ratio: number | null },
  mode: BudgetDisplay,
  money: MoneyFormatter
): BudgetStatus | null {
  if (budget == null) {
    return null;
  }

  const over = spent > budget;

  if (mode === "currency") {
    const diff = Math.abs(budget - spent);
    return { label: over ? `${money.format(diff)} over` : `${money.format(diff)} left`, over };
  }

  const percent = Math.round((ratio ?? 0) * 100);
  return { label: over ? `${percent}% over` : `${percent}%`, over };
}

export function transactionsForCategory(
  categories: Category[],
  transactions: Transaction[],
  categoryId: number,
  month: string
): Transaction[] {
  const ids = collectDescendantIds(categories, categoryId);
  return monthTransactions(transactions, month)
    .filter((transaction) => ids.has(transaction.category_id))
    .sort((a, b) => {
      if (a.date === b.date) {
        return b.id - a.id;
      }
      return a.date < b.date ? 1 : -1;
    });
}

export function categoryById(
  categories: Category[],
  id: number
): Category | undefined {
  return categories.find((category) => category.id === id);
}

export function parentTitle(
  categories: Category[],
  category: Category
): string | null {
  if (category.parent_id == null) {
    return null;
  }

  return categoryById(categories, category.parent_id)?.title ?? null;
}
