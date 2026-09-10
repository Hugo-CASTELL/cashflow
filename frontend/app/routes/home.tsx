import { Link } from "react-router";
import type { Route } from "./+types/home";
import { useAppData } from "~/components/app-data";
import { CategoryBudgetCard } from "~/components/category-budget-card";
import { ExpenseChart, useChartHover } from "~/components/expense-chart";
import { useSelectedMonth } from "~/hooks/use-selected-month";
import { categorySpendList } from "~/lib/finance";
import { formatMonthLabel, monthHref } from "~/lib/month";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Overview · Cashflow" },
    { name: "description", content: "Current month expenses by category" },
  ];
}

export default function Home() {
  const { categories, transactions } = useAppData();
  const [month] = useSelectedMonth();
  const [hoveredId, setHoveredId] = useChartHover();
  const items = categorySpendList(categories, transactions, month);
  const midpoint = Math.ceil(items.length / 2);
  const left = items.slice(0, midpoint);
  const right = items.slice(midpoint);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex shrink-0 items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {formatMonthLabel(month)}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Spending</h1>
        </div>
        <Link
          to={monthHref("/recap", month)}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Full recap
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center py-4">
          <div className="rounded-2xl bg-muted/50 px-4 py-12 text-center">
            <p className="font-medium">No categories yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create categories and budgets to see this month at a glance.
            </p>
            <Link
              to={monthHref("/categories", month)}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Add categories
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center py-4">
          <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)_minmax(0,1fr)] lg:gap-6">
            <div className="hidden max-h-[min(32rem,50dvh)] space-y-2 overflow-y-auto lg:block">
              {left.map((item) => (
                <CategoryBudgetCard
                  key={item.category.id}
                  item={item}
                  month={month}
                  active={hoveredId === item.category.id}
                />
              ))}
            </div>

            <div className="flex flex-col items-center">
              <ExpenseChart
                items={items}
                month={month}
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
              <p className="mt-2 max-w-[16rem] text-center text-xs text-muted-foreground">
                Tap the center for this month&apos;s recap. Tap a slice or category for details.
              </p>
            </div>

            <div className="hidden max-h-[min(32rem,50dvh)] space-y-2 overflow-y-auto lg:block">
              {right.map((item) => (
                <CategoryBudgetCard
                  key={item.category.id}
                  item={item}
                  month={month}
                  active={hoveredId === item.category.id}
                />
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:hidden">
              {items.map((item) => (
                <CategoryBudgetCard
                  key={item.category.id}
                  item={item}
                  month={month}
                  active={hoveredId === item.category.id}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
