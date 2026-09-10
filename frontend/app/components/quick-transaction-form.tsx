import { type FormEvent, useEffect, useState } from "react";
import { Link, useRevalidator } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { NativeSelect } from "~/components/native-select";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useAppData } from "~/components/app-data";
import { api } from "~/lib/api";
import { defaultDateForMonth, monthHref } from "~/lib/month";
import { cn } from "~/lib/utils";

export function QuickTransactionForm({ month }: { month: string }) {
  const { categories } = useAppData();
  const revalidator = useRevalidator();
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(() => defaultDateForMonth(month));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDate(defaultDateForMonth(month));
  }, [month]);

  useEffect(() => {
    if (!status) {
      return;
    }

    const timeout = window.setTimeout(() => setStatus(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [status]);

  useEffect(() => {
    if (!categoryId && categories[0]) {
      setCategoryId(String(categories[0].id));
    }
  }, [categories, categoryId]);

  const disabled = busy || revalidator.state !== "idle" || categories.length === 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const parsedCategoryId = Number(categoryId);
    const trimmedTitle = title.trim();

    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      setError("Enter an amount");
      return;
    }

    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      setError("Choose a category");
      return;
    }

    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      await api.createTransaction({
        amount: parsedAmount,
        date,
        category_id: parsedCategoryId,
        title: trimmedTitle === "" ? null : trimmedTitle,
      });
      setAmount("");
      setTitle("");
      setStatus("Added");
      revalidator.revalidate();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not add transaction");
    } finally {
      setBusy(false);
    }
  }

  if (categories.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        <Link to={monthHref("/categories", month)} className="font-medium text-foreground underline-offset-4 hover:underline">
          Add a category
        </Link>{" "}
        to start tracking spending.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 md:grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,1fr)_9.5rem_auto]">
        <label className="col-span-3 md:col-span-1">
          <span className="sr-only">Amount</span>
          <Input
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Amount"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setStatus(null);
              setError(null);
            }}
            className="h-11 text-base md:h-9"
            aria-invalid={error === "Enter an amount"}
          />
        </label>
        <label className="col-span-3 md:col-span-1">
          <span className="sr-only">Title (optional)</span>
          <Input
            name="title"
            autoComplete="off"
            placeholder="Title (optional)"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setStatus(null);
              setError(null);
            }}
            className="h-11 text-base md:h-9"
          />
        </label>
        <label className="col-span-1 md:col-span-1">
          <span className="sr-only">Category</span>
          <NativeSelect
            name="category_id"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-11 md:h-9"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="col-span-1 md:col-span-1">
          <span className="sr-only">Date</span>
          <Input
            type="date"
            name="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-11 text-base md:h-9"
          />
        </label>
        <Button
          type="submit"
          disabled={disabled}
          size="lg"
          className="h-11 min-w-11 px-3 md:h-9"
          aria-label="Add transaction"
        >
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>
      <p
        className={cn(
          "min-h-4 text-center text-xs",
          error ? "text-destructive" : "text-muted-foreground"
        )}
        aria-live="polite"
      >
        {error ?? status ?? "Quick add a transaction"}
      </p>
    </form>
  );
}
