export interface Category {
  id: number
  title: string
  parent_id: number | null
}

export interface Transaction {
  id: number
  amount: string
  date: string
  category_id: number
}

export interface CreateCategoryInput {
  title: string
  parent_id?: number | null
}

export interface CreateTransactionInput {
  amount: number | string
  date: string
  category_id: number
}

function getBrowserApiBase(): string {
  return import.meta.env.VITE_API_URL ?? "/api"
}

function getServerApiBase(): string {
  return process.env.API_URL ?? "http://localhost:3000"
}

export function getApiBase(isServer = typeof window === "undefined"): string {
  return isServer ? getServerApiBase() : getBrowserApiBase()
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isServer = typeof window === "undefined"
): Promise<T> {
  const base = getApiBase(isServer)
  const response = await fetch(`${base}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  listCategories: (isServer?: boolean) =>
    request<Category[]>("/categories", {}, isServer),
  createCategory: (data: CreateCategoryInput) =>
    request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: number) =>
    request<void>(`/categories/${id}`, { method: "DELETE" }),
  listTransactions: (isServer?: boolean) =>
    request<Transaction[]>("/transactions", {}, isServer),
  createTransaction: (data: CreateTransactionInput) =>
    request<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteTransaction: (id: number) =>
    request<void>(`/transactions/${id}`, { method: "DELETE" }),
}

export const SAMPLE_BARCODED_CATEGORIES = [
  { barcode: "1234567890123", title: "Groceries" },
  { barcode: "2345678901234", title: "Transport" },
  { barcode: "3456789012345", title: "Entertainment" },
] as const

export const SAMPLE_BARCODED_TRANSACTIONS = [
  { barcode: "9876543210987", amount: "12.99", title: "Milk" },
  { barcode: "8765432109876", amount: "45.50", title: "Bus pass" },
  { barcode: "7654321098765", amount: "9.99", title: "Movie ticket" },
] as const

export function categoryTitleFromBarcode(barcode: string, label: string): string {
  return `${label} [${barcode}]`
}
