import { Link } from "react-router";
import { monthHref } from "~/lib/month";
import { formatMoney } from "~/lib/money";
import { cn } from "~/lib/utils";
import type { CategorySpend } from "~/lib/finance";

export function CategoryBudgetCard({
  item,
  month,
  active = false,
}: {
  item: CategorySpend;
  month: string;
  active?: boolean;
}) {
  const percent =
    item.ratio == null ? null : Math.round(Math.min(item.ratio, 2) * 100);
  const width = item.ratio == null ? 0 : Math.min(item.ratio * 100, 100);

  return (
    <Link
      to={monthHref(`/categories/${item.category.id}`, month)}
      className={cn(
        "block rounded-xl p-3 ring-1 ring-foreground/10 transition-colors",
        "hover:bg-muted/70 active:bg-muted",
        active && "bg-muted ring-foreground/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <p className="truncate font-medium">{item.category.title}</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.budget == null
              ? `${formatMoney(item.spent)} spent`
              : `${formatMoney(item.spent)} of ${formatMoney(item.budget)}`}
          </p>
        </div>
        <p
          className={cn(
            "shrink-0 text-xs font-medium",
            item.overBudget ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {percent == null ? "No budget" : item.overBudget ? `${percent}% over` : `${percent}%`}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width]", item.overBudget && "bg-destructive")}
          style={{
            width: `${width}%`,
            backgroundColor: item.overBudget ? undefined : item.color,
          }}
        />
      </div>
    </Link>
  );
}
