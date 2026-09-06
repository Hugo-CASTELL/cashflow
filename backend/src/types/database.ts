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

export interface UpdateCategoryInput {
  title?: string
  parent_id?: number | null
}

export interface CreateTransactionInput {
  amount: number | string
  date: string
  category_id: number
}

export interface UpdateTransactionInput {
  amount?: number | string
  date?: string
  category_id?: number
}
