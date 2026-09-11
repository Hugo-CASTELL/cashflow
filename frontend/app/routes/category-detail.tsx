import { Link, data } from "react-router";
import type { Route } from "./+types/category-detail";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { useAppData, useMoney, useSettings } from "~/components/app-data";
import { TransactionList } from "~/components/transaction-list";
import { useSelectedMonth } from "~/hooks/use-selected-month";
import {
  budgetStatus,
  categoryById,
  collectDescendantIds,
  parentTitle,
  rolledUpSpend,
  transactionsForCategory,
} from "~/lib/finance";
import { colorForCategory } from "~/lib/colors";
import { formatMonthLabel, monthHref } from "~/lib/month";
import { parseMoney } from "~/lib/money";
import { cn } from "~/lib/utils";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Category · Cashflow` },
    { name: "description", content: `Transactions for category ${params.categoryId}` },
  ];
}

export function loader({ params }: Route.LoaderArgs) {
  const categoryId = Number(params.categoryId);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw data("Category not found", { status: 404 });
  }

  return { categoryId };
}

export default function CategoryDetail({ loaderData }: Route.ComponentProps) {
  const { categories, transactions } = useAppData();
  const money = useMoney();
  const { budgetDisplay } = useSettings();
  const [month] = useSelectedMonth();
  const category = categoryById(categories, loaderData.categoryId);

  if (!category) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Category not found</h1>
        <Link to={monthHref("/", month)} className="text-sm underline-offset-4 hover:underline">
          Back to overview
        </Link>
      </div>
    );
  }

  const rows = transactionsForCategory(categories, transactions, category.id, month);
  const spendByCategory = rolledUpSpend(categories, transactions, month);
  const spent = spendByCategory.get(category.id) ?? 0;
  const budget = category.monthly_budget == null ? null : parseMoney(category.monthly_budget);
  const ratio = budget != null && budget > 0 ? spent / budget : null;
  const over = budget != null && spent > budget;
  const status = budgetStatus({ spent, budget, ratio }, budgetDisplay, money);
  const parent = parentTitle(categories, category);
  const children = categories.filter((item) => item.parent_id === category.id);
  const descendantIds = collectDescendantIds(categories, category.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to={monthHref("/", month)}
        className="inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={2} />
        Overview
      </Link>

      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: colorForCategory(category.id) }}
          />
          <h1 className="text-2xl font-semibold tracking-tight">{category.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatMonthLabel(month)}
          {parent ? ` · in ${parent}` : ""}
        </p>
        <p className="text-lg font-medium tabular-nums">
          {money.format(spent)}
          {budget != null ? (
            <span className={cn("text-sm font-normal", over ? "text-destructive" : "text-muted-foreground")}>
              {" "}
              of {money.format(budget)}
              {status ? ` · ${status.label}` : ""}
            </span>
          ) : (
            <span className="text-sm font-normal text-muted-foreground"> spent</span>
          )}
        </p>
        {budget != null ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", over && "bg-destructive")}
              style={{
                width: `${Math.min((ratio ?? 0) * 100, 100)}%`,
                backgroundColor: over ? undefined : colorForCategory(category.id),
              }}
            />
          </div>
        ) : null}
      </header>

      {children.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Subcategories</h2>
          <ul className="grid gap-2">
            {children.map((child) => {
              const childSpent = spendByCategory.get(child.id) ?? 0;
              return (
                <li key={child.id}>
                  <Link
                    to={monthHref(`/categories/${child.id}`, month)}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 ring-1 ring-foreground/10 hover:bg-muted/70"
                  >
                    <span>{child.title}</span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {money.format(childSpent)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <TransactionList
        transactions={rows}
        categories={categories}
        showCategory={descendantIds.size > 1}
        emptyLabel="No transactions in this category for the selected month."
        month={month}
      />
    </div>
  );
}
