import { createContext, useContext, type ReactNode } from "react";
import type { Category, Transaction } from "~/lib/api";

export type AppData = {
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
