import { Link } from "react-router";
import { useMoney, useSettings } from "~/components/app-data";
import { budgetStatus, type CategorySpend } from "~/lib/finance";
import { monthHref } from "~/lib/month";
import { cn } from "~/lib/utils";

export function CategoryBudgetCard({
  item,
  month,
  active = false,
}: {
  item: CategorySpend;
  month: string;
  active?: boolean;
}) {
  const money = useMoney();
  const { budgetDisplay } = useSettings();
  const status = budgetStatus(item, budgetDisplay, money);
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
              ? `${money.format(item.spent)} spent`
              : `${money.format(item.spent)} of ${money.format(item.budget)}`}
          </p>
        </div>
        <p
          className={cn(
            "shrink-0 text-xs font-medium tabular-nums",
            status?.over ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {status == null ? "No budget" : status.label}
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
