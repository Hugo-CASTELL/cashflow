import { NavLink, useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartRingIcon,
  Invoice01Icon,
  Logout03Icon,
  Settings01Icon,
  TagsIcon,
} from "@hugeicons/core-free-icons";
import { useAppData } from "~/components/app-data";
import { Button } from "~/components/ui/button";
import { clearSession } from "~/lib/auth";
import { monthHref } from "~/lib/month";
import { cn } from "~/lib/utils";

const links = [
  { to: "/", label: "Overview", icon: ChartRingIcon, end: true },
  { to: "/recap", label: "Recap", icon: Invoice01Icon, end: false },
  { to: "/categories", label: "Categories", icon: TagsIcon, end: false },
] as const;

export function TopNav({ month }: { month: string }) {
  const { account } = useAppData();
  const navigate = useNavigate();

  function handleSignOut() {
    clearSession();
    navigate("/auth", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <div className="hidden min-w-0 shrink-0 sm:block">
          <p className="text-sm font-semibold tracking-tight">Cashflow</p>
          {account?.name ? (
            <p className="truncate text-xs text-muted-foreground">{account.name}</p>
          ) : null}
        </div>
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
        <div className="flex shrink-0 items-center gap-0.5">
          <NavLink
            to={monthHref("/settings", month)}
            aria-label="Settings"
            title="Settings"
            className={({ isActive }) =>
              cn(
                "inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive && "bg-muted text-foreground"
              )
            }
          >
            <HugeiconsIcon icon={Settings01Icon} size={16} strokeWidth={2} />
          </NavLink>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="Sign out"
            title="Sign out"
            onClick={handleSignOut}
          >
            <HugeiconsIcon icon={Logout03Icon} size={16} strokeWidth={2} />
          </Button>
        </div>
      </div>
    </header>
  );
}
