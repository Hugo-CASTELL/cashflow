import { Outlet, redirect } from "react-router";
import type { Route } from "./+types/layout";
import { AppShell } from "~/components/app-shell";
import { api, ApiError, type Category, type PublicAccount, type Transaction } from "~/lib/api";
import { getSecretFromRequest } from "~/lib/auth";

export async function loader({ request }: Route.LoaderArgs) {
  const secret = getSecretFromRequest(request);
  if (!secret) {
    const url = new URL(request.url);
    const next = `${url.pathname}${url.search}`;
    throw redirect(`/auth?next=${encodeURIComponent(next)}`);
  }

  try {
    const [account, categories, transactions] = await Promise.all([
      api.getMe(secret, true),
      api.listCategories(secret, true),
      api.listTransactions(secret, true),
    ]);

    return {
      account,
      categories,
      transactions,
      loadError: null as string | null,
    };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      const url = new URL(request.url);
      const next = `${url.pathname}${url.search}`;
      throw redirect(`/auth?next=${encodeURIComponent(next)}`);
    }

    const message =
      error instanceof Error && /fetch failed|ECONNREFUSED|ENOTFOUND/i.test(error.message)
        ? "Could not reach the API. Is the backend running?"
        : error instanceof Error
          ? error.message
          : "Could not load data";

    return {
      account: null as PublicAccount | null,
      categories: [] as Category[],
      transactions: [] as Transaction[],
      loadError: message,
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
