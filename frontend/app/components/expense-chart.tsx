import { type ComponentType, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMoney } from "~/components/app-data";
import { monthHref } from "~/lib/month";
import type { MoneyFormatter } from "~/lib/money";
import type { ChartType } from "~/lib/settings";
import { cn } from "~/lib/utils";
import type { CategorySpend } from "~/lib/finance";

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function donutSlicePath(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  start: number,
  end: number
) {
  const large = end - start > 180 ? 1 : 0;
  const p1 = polar(cx, cy, outer, start);
  const p2 = polar(cx, cy, outer, end);
  const p3 = polar(cx, cy, inner, end);
  const p4 = polar(cx, cy, inner, start);
  return `M ${p1.x} ${p1.y} A ${outer} ${outer} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${inner} ${inner} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
}

function pieSlicePath(cx: number, cy: number, outer: number, start: number, end: number) {
  const large = end - start > 180 ? 1 : 0;
  const p1 = polar(cx, cy, outer, start);
  const p2 = polar(cx, cy, outer, end);
  return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${outer} ${outer} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
}

type SliceProps = {
  slices: CategorySpend[];
  total: number;
  month: string;
  hoveredId: number | null;
  onHover: (id: number | null) => void;
  money: MoneyFormatter;
};

function useSliceAngles(slices: CategorySpend[], total: number, gap: number) {
  return useMemo(() => {
    if (slices.length === 0 || total <= 0) {
      return [];
    }

    if (slices.length === 1) {
      return [{ item: slices[0], start: 0, end: 359.99 }];
    }

    let angle = 0;
    return slices.map((item) => {
      const sweep = (item.spent / total) * 360;
      const start = angle + gap / 2;
      const end = angle + sweep - gap / 2;
      angle += sweep;
      return { item, start, end: Math.max(end, start + 0.4) };
    });
  }, [gap, slices, total]);
}

function SliceLink({
  item,
  d,
  month,
  hoveredId,
  onHover,
  money,
}: {
  item: CategorySpend;
  d: string;
  month: string;
  hoveredId: number | null;
  onHover: (id: number | null) => void;
  money: MoneyFormatter;
}) {
  const navigate = useNavigate();
  const href = monthHref(`/categories/${item.category.id}`, month);
  const label = `${item.category.title}: ${money.formatCompact(item.spent)}`;

  return (
    <a
      href={href}
      className="outline-none"
      onClick={(event) => {
        event.preventDefault();
        void navigate(href);
      }}
    >
      <path
        d={d}
        fill={item.color}
        className="transition-opacity"
        opacity={hoveredId == null || hoveredId === item.category.id ? 1 : 0.45}
        onMouseEnter={() => onHover(item.category.id)}
        onMouseLeave={() => onHover(null)}
      >
        <title>{label}</title>
      </path>
    </a>
  );
}

function TotalSummary({
  total,
  month,
  money,
  className,
}: {
  total: number;
  month: string;
  money: MoneyFormatter;
  className?: string;
}) {
  return (
    <Link
      to={monthHref("/recap", month)}
      className={cn(
        "flex flex-col items-center justify-center text-center transition-colors hover:bg-muted/60 active:bg-muted",
        className
      )}
    >
      <span className="text-xl font-semibold tracking-tight sm:text-2xl">
        {money.formatCompact(total)}
      </span>
      <span className="mt-0.5 text-[11px] text-muted-foreground">
        {total === 0 ? "No expenses" : "View recap"}
      </span>
    </Link>
  );
}

function DonutChart({ slices, total, month, hoveredId, onHover, money }: SliceProps) {
  // Keep the ring inside the 100×100 viewBox: stroke is centered on the path,
  // so r + strokeWidth/2 must stay ≤ 50 (with a little padding for hover grow).
  const outer = 42;
  const inner = 28;
  const hoverOuter = 43.5;
  const trackStroke = 12;
  const angles = useSliceAngles(slices, total, 1.2);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[18rem] overflow-visible p-1 sm:max-w-[20rem]">
      <svg viewBox="0 0 100 100" className="size-full overflow-visible" role="img" aria-label="Expenses by category">
        <circle
          cx="50"
          cy="50"
          r={outer}
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth={trackStroke}
        />
        {angles.map(({ item, start, end }) => (
          <SliceLink
            key={item.category.id}
            item={item}
            d={donutSlicePath(
              50,
              50,
              inner,
              hoveredId === item.category.id ? hoverOuter : outer,
              start,
              end
            )}
            month={month}
            hoveredId={hoveredId}
            onHover={onHover}
            money={money}
          />
        ))}
      </svg>
      <TotalSummary
        total={total}
        month={month}
        money={money}
        className="absolute inset-[22%] rounded-full"
      />
    </div>
  );
}

function PieChart({ slices, total, month, hoveredId, onHover, money }: SliceProps) {
  const outer = 46;
  const hoverOuter = 48;
  const angles = useSliceAngles(slices, total, 1);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="mx-auto aspect-square w-full max-w-[16rem] overflow-visible p-1 sm:max-w-[18rem]">
        <svg viewBox="0 0 100 100" className="size-full overflow-visible" role="img" aria-label="Expenses by category">
          {angles.length === 0 ? (
            <circle cx="50" cy="50" r={outer} fill="currentColor" className="text-muted" />
          ) : null}
          {angles.map(({ item, start, end }) => (
            <SliceLink
              key={item.category.id}
              item={item}
              d={pieSlicePath(
                50,
                50,
                hoveredId === item.category.id ? hoverOuter : outer,
                start,
                end
              )}
              month={month}
              hoveredId={hoveredId}
              onHover={onHover}
              money={money}
            />
          ))}
        </svg>
      </div>
      <TotalSummary total={total} month={month} money={money} className="rounded-xl px-4 py-1.5" />
    </div>
  );
}

function BarChart({ slices, total, month, hoveredId, onHover, money }: SliceProps) {
  const max = slices.reduce((peak, item) => Math.max(peak, item.spent), 0);

  return (
    <div className="flex w-full max-w-[20rem] flex-col gap-3">
      <TotalSummary total={total} month={month} money={money} className="rounded-xl px-4 py-1.5" />
      {slices.length === 0 ? (
        <div className="h-2.5 rounded-full bg-muted" aria-hidden="true" />
      ) : (
        <ul className="space-y-2" aria-label="Expenses by category">
          {slices.map((item) => {
            const dimmed = hoveredId != null && hoveredId !== item.category.id;
            return (
              <li key={item.category.id}>
                <Link
                  to={monthHref(`/categories/${item.category.id}`, month)}
                  className={cn(
                    "block rounded-lg px-1 py-0.5 transition-opacity hover:bg-muted/60",
                    dimmed && "opacity-45"
                  )}
                  onMouseEnter={() => onHover(item.category.id)}
                  onMouseLeave={() => onHover(null)}
                  title={`${item.category.title}: ${money.formatCompact(item.spent)}`}
                >
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="truncate font-medium">{item.category.title}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {money.formatCompact(item.spent)}
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{
                        width: `${max > 0 ? (item.spent / max) * 100 : 0}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const CHARTS: Record<ChartType, ComponentType<SliceProps>> = {
  donut: DonutChart,
  pie: PieChart,
  bar: BarChart,
};

export function ExpenseChart({
  items,
  month,
  hoveredId,
  onHover,
  type = "donut",
}: {
  items: CategorySpend[];
  month: string;
  hoveredId: number | null;
  onHover: (id: number | null) => void;
  type?: ChartType;
}) {
  const money = useMoney();
  const slices = useMemo(() => items.filter((item) => item.spent > 0), [items]);
  const total = slices.reduce((sum, item) => sum + item.spent, 0);
  const Chart = CHARTS[type] ?? DonutChart;

  return (
    <Chart
      slices={slices}
      total={total}
      month={month}
      hoveredId={hoveredId}
      onHover={onHover}
      money={money}
    />
  );
}

export function useChartHover() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  return [hoveredId, setHoveredId] as const;
}
