import { Link } from "react-router";
import type { Route } from "./+types/recap";
import { useAppData, useMoney } from "~/components/app-data";
import { TransactionList } from "~/components/transaction-list";
import { useSelectedMonth } from "~/hooks/use-selected-month";
import { categorySpendList, monthTransactions } from "~/lib/finance";
import { formatMonthLabel, monthHref } from "~/lib/month";
import { parseMoney } from "~/lib/money";
import { colorForCategory } from "~/lib/colors";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Month recap · Cashflow" },
    { name: "description", content: "All transactions for the selected month" },
  ];
}

export default function Recap() {
  const { categories, transactions } = useAppData();
  const money = useMoney();
  const [month] = useSelectedMonth();
  const rows = monthTransactions(transactions, month);
  const total = rows.reduce((sum, row) => sum + parseMoney(row.amount), 0);
  const byCategory = categorySpendList(categories, transactions, month).filter(
    (item) => item.spent > 0
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {formatMonthLabel(month)}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Month recap</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} transaction{rows.length === 1 ? "" : "s"} · {money.format(total)}
        </p>
      </header>

      {byCategory.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {byCategory.map((item) => (
            <li key={item.category.id}>
              <Link
                to={monthHref(`/categories/${item.category.id}`, month)}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 ring-1 ring-foreground/10 hover:bg-muted/70"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colorForCategory(item.category.id) }}
                  />
                  <span className="truncate text-sm">{item.category.title}</span>
                </span>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {money.format(item.spent)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <TransactionList transactions={rows} categories={categories} month={month} />
    </div>
  );
}
