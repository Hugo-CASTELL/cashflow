import { NavLink } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartRingIcon,
  Invoice01Icon,
  TagsIcon,
} from "@hugeicons/core-free-icons";
import { monthHref } from "~/lib/month";
import { cn } from "~/lib/utils";

const links = [
  { to: "/", label: "Overview", icon: ChartRingIcon, end: true },
  { to: "/recap", label: "Recap", icon: Invoice01Icon, end: false },
  { to: "/categories", label: "Categories", icon: TagsIcon, end: false },
] as const;

export function TopNav({ month }: { month: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <p className="hidden shrink-0 text-sm font-semibold tracking-tight sm:block">
          Cashflow
        </p>
        <nav className="grid min-w-0 flex-1 grid-cols-3 rounded-xl bg-muted p-1 sm:max-w-md">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={monthHref(link.to, month)}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors sm:text-sm",
                  isActive && "bg-background text-foreground shadow-sm"
                )
              }
            >
              <HugeiconsIcon icon={link.icon} size={16} strokeWidth={2} className="sm:hidden" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
