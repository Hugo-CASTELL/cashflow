import { type FormEvent, useEffect, useState } from "react";
import { useRevalidator } from "react-router";
import type { Route } from "./+types/categories";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { NativeSelect } from "~/components/native-select";
import { useAppData, useMoney } from "~/components/app-data";
import { api, type Category } from "~/lib/api";
import { colorForCategory } from "~/lib/colors";
import { parentTitle } from "~/lib/finance";
import { currencySymbol, parseMoney } from "~/lib/money";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Categories · Cashflow" },
    { name: "description", content: "Manage spending categories and monthly budgets" },
  ];
}

export default function CategoriesPage() {
  const { categories, transactions } = useAppData();
  const money = useMoney();
  const symbol = currencySymbol(money.currency);
  const revalidator = useRevalidator();
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    const next: Record<number, string> = {};
    for (const category of categories) {
      next[category.id] = category.monthly_budget ?? "";
    }
    setDrafts(next);
  }, [categories]);

  const lockedIds = new Set(transactions.map((transaction) => transaction.category_id));

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await action();
      setStatus(success);
      revalidator.revalidate();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function addCategory(event: FormEvent) {
    event.preventDefault();
    if (title.trim() === "") {
      setError("Enter a category name");
      return;
    }

    await run(async () => {
      await api.createCategory({
        title: title.trim(),
        parent_id: parentId ? Number(parentId) : null,
        monthly_budget: budget.trim() === "" ? null : budget,
      });
      setTitle("");
      setParentId("");
      setBudget("");
    }, "Category added");
  }

  async function saveBudget(category: Category) {
    const value = drafts[category.id] ?? "";
    await run(async () => {
      await api.updateCategory(category.id, {
        monthly_budget: value.trim() === "" ? null : value,
      });
    }, `Updated ${category.title}`);
  }

  async function removeCategory(category: Category) {
    if (!window.confirm(`Delete ${category.title}?`)) {
      return;
    }
    await run(async () => {
      await api.deleteCategory(category.id);
    }, `Deleted ${category.title}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Set a monthly budget for each category. Child spend rolls up to parents.
        </p>
      </header>

      <form onSubmit={addCategory} className="space-y-3 rounded-2xl p-4 ring-1 ring-foreground/10">
        <p className="font-medium">New category</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="category-title">Name</Label>
            <Input
              id="category-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Groceries"
              className="h-11 md:h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category-parent">Parent</Label>
            <NativeSelect
              id="category-parent"
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
            >
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category-budget">Monthly budget ({symbol})</Label>
            <Input
              id="category-budget"
              inputMode="decimal"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder="Optional"
              className="h-11 md:h-9"
            />
          </div>
        </div>
        <Button type="submit" disabled={busy} className="h-11 w-full sm:w-auto md:h-9">
          Add category
        </Button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => {
            const parent = parentTitle(categories, category);
            const current = drafts[category.id] ?? "";
            const saved = category.monthly_budget ?? "";
            const dirty = current !== saved;

            return (
              <li
                key={category.id}
                className="space-y-3 rounded-2xl p-3 ring-1 ring-foreground/10 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: colorForCategory(category.id) }}
                      />
                      <p className="truncate font-medium">{category.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {parent ? `In ${parent}` : "Top-level"}
                      {category.monthly_budget
                        ? ` · ${money.format(parseMoney(category.monthly_budget))} / month`
                        : " · no budget"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy || lockedIds.has(category.id)}
                    className={cn(lockedIds.has(category.id) && "opacity-40")}
                    onClick={() => {
                      void removeCategory(category);
                    }}
                  >
                    Delete
                  </Button>
                </div>
                <div className="flex items-end gap-2">
                  <label className="min-w-0 flex-1 space-y-1">
                    <span className="text-xs text-muted-foreground">Monthly budget ({symbol})</span>
                    <Input
                      inputMode="decimal"
                      value={current}
                      onChange={(event) =>
                        setDrafts((prev) => ({ ...prev, [category.id]: event.target.value }))
                      }
                      placeholder="None"
                      className="h-11 md:h-9"
                    />
                  </label>
                  <Button
                    type="button"
                    variant={dirty ? "default" : "secondary"}
                    disabled={busy || !dirty}
                    className="h-11 md:h-9"
                    onClick={() => {
                      void saveBudget(category);
                    }}
                  >
                    Save
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
