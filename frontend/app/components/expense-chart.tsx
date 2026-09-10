import { type ReactNode, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { monthHref } from "~/lib/month";
import { formatMoneyCompact } from "~/lib/money";
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

function SliceLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        void navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export function ExpenseChart({
  items,
  month,
  hoveredId,
  onHover,
}: {
  items: CategorySpend[];
  month: string;
  hoveredId: number | null;
  onHover: (id: number | null) => void;
}) {
  const slices = useMemo(() => items.filter((item) => item.spent > 0), [items]);
  const total = slices.reduce((sum, item) => sum + item.spent, 0);
  const recapHref = monthHref("/recap", month);

  const paths = useMemo(() => {
    if (slices.length === 0 || total <= 0) {
      return [];
    }

    if (slices.length === 1) {
      return [
        {
          item: slices[0],
          d: donutSlicePath(50, 50, 31, 46, 0, 359.99),
        },
      ];
    }

    const gap = 1.2;
    let angle = 0;
    return slices.map((item) => {
      const sweep = (item.spent / total) * 360;
      const start = angle + gap / 2;
      const end = angle + sweep - gap / 2;
      angle += sweep;
      return {
        item,
        d: donutSlicePath(50, 50, 31, hoveredId === item.category.id ? 47.5 : 46, start, Math.max(end, start + 0.4)),
      };
    });
  }, [hoveredId, slices, total]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[18rem] sm:max-w-[20rem]">
      <svg viewBox="0 0 100 100" className="size-full" role="img" aria-label="Expenses by category">
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" className="text-muted" strokeWidth="12" />
        {paths.map(({ item, d }) => (
          <SliceLink
            key={item.category.id}
            to={monthHref(`/categories/${item.category.id}`, month)}
            className="outline-none"
          >
            <path
              d={d}
              fill={item.color}
              className="transition-opacity"
              opacity={hoveredId == null || hoveredId === item.category.id ? 1 : 0.45}
              onMouseEnter={() => onHover(item.category.id)}
              onMouseLeave={() => onHover(null)}
            >
              <title>
                {item.category.title}: {formatMoneyCompact(item.spent)}
              </title>
            </path>
          </SliceLink>
        ))}
      </svg>
      <Link
        to={recapHref}
        className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full text-center transition-colors hover:bg-muted/60 active:bg-muted"
      >
        <span className="text-xl font-semibold tracking-tight sm:text-2xl">
          {formatMoneyCompact(total)}
        </span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">
          {total === 0 ? "No expenses" : "View recap"}
        </span>
      </Link>
    </div>
  );
}

export function useChartHover() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  return [hoveredId, setHoveredId] as const;
}
