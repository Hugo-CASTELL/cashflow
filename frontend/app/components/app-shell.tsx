import type { ReactNode } from "react";
import { TopNav } from "~/components/top-nav";
import { MonthSwitcher } from "~/components/month-switcher";
import { QuickTransactionForm } from "~/components/quick-transaction-form";
import { AppDataProvider, type AppData } from "~/components/app-data";
import { useSelectedMonth } from "~/hooks/use-selected-month";

export function AppShell({
  data,
  children,
}: {
  data: AppData;
  children: ReactNode;
}) {
  const [month, setMonth] = useSelectedMonth();

  return (
    <AppDataProvider value={data}>
      <div className="flex min-h-dvh flex-col bg-background">
        <TopNav month={month} />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-[calc(16.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-4 md:pb-[calc(10.5rem+env(safe-area-inset-bottom))]">
          {data.loadError ? (
            <p className="mb-4 shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {data.loadError}
            </p>
          ) : null}
          {children}
        </main>
        <footer className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md">
          <div className="mx-auto max-w-6xl space-y-2 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
            <MonthSwitcher month={month} onChange={setMonth} />
            <QuickTransactionForm month={month} />
          </div>
        </footer>
      </div>
    </AppDataProvider>
  );
}
