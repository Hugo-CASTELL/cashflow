import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Category, PublicAccount, Transaction } from "~/lib/api";
import { createMoneyFormatter, type MoneyFormatter } from "~/lib/money";
import { settingsFromAccount, type Settings } from "~/lib/settings";

export type AppData = {
  account: PublicAccount | null;
  categories: Category[];
  transactions: Transaction[];
  loadError: string | null;
};

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({
  value,
  children,
}: {
  value: AppData;
  children: ReactNode;
}) {
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const data = useContext(AppDataContext);
  if (!data) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return data;
}

export function useSettings(): Settings {
  const { account } = useAppData();
  return useMemo(() => settingsFromAccount(account), [account]);
}

export function useMoney(): MoneyFormatter {
  const { currency } = useSettings();
  return useMemo(() => createMoneyFormatter(currency), [currency]);
}
