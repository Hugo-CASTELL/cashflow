import { Link, useRevalidator } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "~/components/ui/button";
import { api, type Category, type Transaction } from "~/lib/api";
import { colorForCategory } from "~/lib/colors";
import { categoryById } from "~/lib/finance";
import { monthHref } from "~/lib/month";
import { formatMoney, parseMoney } from "~/lib/money";

function formatDay(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function TransactionList({
  transactions,
  categories,
  emptyLabel = "No transactions this month.",
  showCategory = true,
  month,
}: {
  transactions: Transaction[];
  categories: Category[];
  emptyLabel?: string;
  showCategory?: boolean;
  month: string;
}) {
  const revalidator = useRevalidator();

  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const groups = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    const list = groups.get(transaction.date) ?? [];
    list.push(transaction);
    groups.set(transaction.date, list);
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this transaction?")) {
      return;
    }

    await api.deleteTransaction(id);
    revalidator.revalidate();
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([date, rows]) => {
        const dayTotal = rows.reduce((sum, row) => sum + parseMoney(row.amount), 0);
        return (
          <section key={date} className="space-y-2">
            <div className="flex items-baseline justify-between gap-3 px-1">
              <h2 className="text-sm font-medium">{formatDay(date)}</h2>
              <p className="text-xs text-muted-foreground">{formatMoney(dayTotal)}</p>
            </div>
            <ul className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
              {rows.map((transaction) => {
                const category = categoryById(categories, transaction.category_id);
                return (
                  <li
                    key={transaction.id}
                    className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: colorForCategory(transaction.category_id) }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      {transaction.title ? (
                        <>
                          <p className="truncate font-medium">{transaction.title}</p>
                          {showCategory ? (
                            <Link
                              to={monthHref(`/categories/${transaction.category_id}`, month)}
                              className="block truncate text-xs text-muted-foreground hover:underline"
                            >
                              {category?.title ?? "Unknown category"}
                            </Link>
                          ) : (
                            <p className="truncate text-xs text-muted-foreground">
                              {category?.title ?? "Unknown category"}
                            </p>
                          )}
                        </>
                      ) : showCategory ? (
                        <Link
                          to={monthHref(`/categories/${transaction.category_id}`, month)}
                          className="block truncate font-medium hover:underline"
                        >
                          {category?.title ?? "Unknown category"}
                        </Link>
                      ) : (
                        <p className="truncate font-medium">
                          {category?.title ?? "Unknown category"}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 font-medium tabular-nums">
                      {formatMoney(parseMoney(transaction.amount))}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-9 text-muted-foreground hover:text-destructive md:size-7"
                      aria-label="Delete transaction"
                      onClick={() => {
                        void remove(transaction.id);
                      }}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
