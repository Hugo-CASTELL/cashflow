import type { AccountSettings, BudgetDisplay, ChartType } from '../lib/account-settings'

export interface Account extends AccountSettings {
  id: number
  name: string
  secret: string
}

export interface PublicAccount extends AccountSettings {
  id: number
  name: string
}

export interface UpdateAccountSettingsInput {
  currency?: string
  budget_display?: BudgetDisplay
  chart_type?: ChartType
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
