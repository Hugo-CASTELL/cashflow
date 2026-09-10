import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { AppShell } from "~/components/app-shell";
import { api, type Category, type Transaction } from "~/lib/api";

export async function loader() {
  try {
    const [categories, transactions] = await Promise.all([
      api.listCategories(true),
      api.listTransactions(true),
    ]);

    return { categories, transactions, loadError: null };
  } catch (error) {
    return {
      categories: [] as Category[],
      transactions: [] as Transaction[],
      loadError: error instanceof Error ? error.message : "Could not load data",
    };
  }
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  return (
    <AppShell data={loaderData}>
      <Outlet />
    </AppShell>
  );
}
