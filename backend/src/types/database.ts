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
