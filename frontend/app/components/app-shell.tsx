import { type ReactNode, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { TopNav } from "~/components/top-nav";
import { MonthSwitcher } from "~/components/month-switcher";
import { QuickTransactionForm } from "~/components/quick-transaction-form";
import { AppDataProvider, type AppData } from "~/components/app-data";
import { Button } from "~/components/ui/button";
import { useSelectedMonth } from "~/hooks/use-selected-month";
import { cn } from "~/lib/utils";

export function AppShell({
  data,
  children,
}: {
  data: AppData;
  children: ReactNode;
}) {
  const [month, setMonth] = useSelectedMonth();
  const [quickOpen, setQuickOpen] = useState(true);

  return (
    <AppDataProvider value={data}>
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <TopNav month={month} />
        <main
          className={cn(
            "mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-4 sm:px-4",
            quickOpen
              ? "pb-[calc(15rem+env(safe-area-inset-bottom))] md:pb-[calc(9.5rem+env(safe-area-inset-bottom))]"
              : "pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-[calc(9.5rem+env(safe-area-inset-bottom))]"
          )}
        >
          {data.loadError ? (
            <p className="mb-4 shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {data.loadError}
            </p>
          ) : null}
          {children}
        </main>
        <footer className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md">
          <div className="mx-auto max-w-6xl space-y-1.5 px-3 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 md:space-y-2 md:pt-2">
            <div className="flex justify-center md:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="h-5 w-12 text-muted-foreground"
                aria-expanded={quickOpen}
                aria-controls="quick-transaction"
                aria-label={quickOpen ? "Hide quick add" : "Show quick add"}
                onClick={() => setQuickOpen((open) => !open)}
              >
                <HugeiconsIcon
                  icon={quickOpen ? ArrowDown01Icon : ArrowUp01Icon}
                  strokeWidth={2}
                />
              </Button>
            </div>
            <MonthSwitcher month={month} onChange={setMonth} />
            <div
              id="quick-transaction"
              className={cn(
                "md:mx-auto md:max-w-2xl",
                !quickOpen && "hidden md:block"
              )}
            >
              <QuickTransactionForm month={month} />
            </div>
          </div>
        </footer>
      </div>
    </AppDataProvider>
  );
}
