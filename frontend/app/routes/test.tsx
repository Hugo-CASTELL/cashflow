import type { Route } from "./+types/test";
import { Link, useRevalidator } from "react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  api,
  categoryTitleFromBarcode,
  SAMPLE_BARCODED_CATEGORIES,
  SAMPLE_BARCODED_TRANSACTIONS,
  type Category,
  type Transaction,
} from "~/lib/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "API Test - Cashflow" },
    { name: "description", content: "Test categories and transactions via the API" },
  ];
}

export async function loader() {
  const [categories, transactions] = await Promise.all([
    api.listCategories(true),
    api.listTransactions(true),
  ]);

  return { categories, transactions };
}

export default function TestPage({ loaderData }: Route.ComponentProps) {
  const revalidator = useRevalidator();
  const [categories, setCategories] = useState<Category[]>(loaderData.categories);
  const [transactions, setTransactions] = useState<Transaction[]>(
    loaderData.transactions
  );
  const [barcode, setBarcode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refresh() {
    const [nextCategories, nextTransactions] = await Promise.all([
      api.listCategories(),
      api.listTransactions(),
    ]);
    setCategories(nextCategories);
    setTransactions(nextTransactions);
    revalidator.revalidate();
  }

  async function runAction(action: () => Promise<void>, successMessage: string) {
    setIsSubmitting(true);
    setStatus(null);

    try {
      await action();
      await refresh();
      setStatus(successMessage);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function addBarcodedCategory(sample: (typeof SAMPLE_BARCODED_CATEGORIES)[number]) {
    await runAction(async () => {
      await api.createCategory({
        title: categoryTitleFromBarcode(sample.barcode, sample.title),
      });
    }, `Added category for barcode ${sample.barcode}`);
  }

  async function addBarcodedTransaction(
    sample: (typeof SAMPLE_BARCODED_TRANSACTIONS)[number],
    categoryId: number
  ) {
    await runAction(async () => {
      await api.createTransaction({
        amount: sample.amount,
        date: new Date().toISOString().slice(0, 10),
        category_id: categoryId,
      });
    }, `Added transaction for barcode ${sample.barcode}`);
  }

  async function addCategoryFromBarcodeInput() {
    const trimmed = barcode.trim();
    if (!trimmed) {
      setStatus("Scan or enter a barcode first");
      return;
    }

    await runAction(async () => {
      await api.createCategory({
        title: categoryTitleFromBarcode(trimmed, "Scanned item"),
      });
      setBarcode("");
    }, `Added category from scanned barcode ${trimmed}`);
  }

  const defaultCategoryId = categories[0]?.id;

  return (
    <main className="container mx-auto max-w-5xl space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">API Test Page</h1>
        <p className="text-muted-foreground">
          Add barcoded categories and transactions to verify the backend CRUD API.
        </p>
        <Link to="/">
          <Button variant="outline">Back home</Button>
        </Link>
      </div>

      {status ? (
        <p className="rounded-lg border border-border bg-muted px-4 py-3 text-sm">
          {status}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Barcoded Categories</CardTitle>
            <CardDescription>
              Quick-add sample categories with embedded barcode values.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {SAMPLE_BARCODED_CATEGORIES.map((sample) => (
                <Button
                  key={sample.barcode}
                  disabled={isSubmitting}
                  onClick={() => addBarcodedCategory(sample)}
                >
                  Add {sample.title}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode scanner input</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void addCategoryFromBarcodeInput();
                  }
                }}
                placeholder="Scan or type a barcode, then press Enter"
                autoComplete="off"
              />
              <Button
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => addCategoryFromBarcodeInput()}
              >
                Add scanned category
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Barcoded Transactions</CardTitle>
            <CardDescription>
              Create sample transactions linked to the first available category.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {defaultCategoryId ? (
              <div className="flex flex-wrap gap-2">
                {SAMPLE_BARCODED_TRANSACTIONS.map((sample) => (
                  <Button
                    key={sample.barcode}
                    disabled={isSubmitting}
                    onClick={() =>
                      addBarcodedTransaction(sample, defaultCategoryId)
                    }
                  >
                    Add {sample.title} (${sample.amount})
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add a category first to create transactions.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No categories yet.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.id}</TableCell>
                    <TableCell>{category.title}</TableCell>
                    <TableCell>{category.parent_id ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() =>
                          runAction(
                            async () => {
                              await api.deleteCategory(category.id);
                            },
                            `Deleted category ${category.id}`
                          )
                        }
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.id}</TableCell>
                    <TableCell>${transaction.amount}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.category_id}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() =>
                          runAction(
                            async () => {
                              await api.deleteTransaction(transaction.id);
                            },
                            `Deleted transaction ${transaction.id}`
                          )
                        }
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
