import { getStoredSecret } from "~/lib/auth"

export interface PublicAccount {
  id: number
  name: string
}

export interface Account extends PublicAccount {
  secret: string
}

export interface Category {
  id: number
  title: string
  parent_id: number | null
  monthly_budget: string | null
  account_id: number
}

export interface Transaction {
  id: number
  amount: string
  date: string
  category_id: number
  title: string | null
  account_id: number
}

export interface CreateAccountInput {
  name: string
}

export interface AuthAccountInput {
  secret: string
}

export interface CreateCategoryInput {
  title: string
  parent_id?: number | null
  monthly_budget?: number | string | null
}

export interface UpdateCategoryInput {
  title?: string
  parent_id?: number | null
  monthly_budget?: number | string | null
}

export interface CreateTransactionInput {
  amount: number | string
  date: string
  category_id: number
  title?: string | null
}

export interface UpdateTransactionInput {
  amount?: number | string
  date?: string
  category_id?: number
  title?: string | null
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
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

type RequestOptions = RequestInit & {
  secret?: string | null
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  isServer = typeof window === "undefined"
): Promise<T> {
  const base = getApiBase(isServer)
  const headers = new Headers(options.headers)
  const { secret, ...fetchOptions } = options

  // Fastify rejects empty bodies when Content-Type is application/json
  // (FST_ERR_CTP_EMPTY_JSON_BODY → 400). Only set it when sending a body.
  if (fetchOptions.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const authSecret =
    secret === undefined ? (isServer ? null : getStoredSecret()) : secret

  if (authSecret && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authSecret}`)
  }

  const response = await fetch(`${base}${path}`, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new ApiError(
      message || `Request failed with status ${response.status}`,
      response.status
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  createAccount: (data: CreateAccountInput) =>
    request<Account>("/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  authenticate: (data: AuthAccountInput) =>
    request<PublicAccount>("/accounts/auth", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: (secret: string, isServer?: boolean) =>
    request<PublicAccount>("/accounts/me", { secret }, isServer),
  listCategories: (secret: string, isServer?: boolean) =>
    request<Category[]>("/categories", { secret }, isServer),
  createCategory: (data: CreateCategoryInput) =>
    request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategory: (id: number, data: UpdateCategoryInput) =>
    request<Category>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: number) =>
    request<void>(`/categories/${id}`, { method: "DELETE" }),
  listTransactions: (secret: string, isServer?: boolean) =>
    request<Transaction[]>("/transactions", { secret }, isServer),
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
