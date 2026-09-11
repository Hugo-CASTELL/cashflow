import { type FastifyPluginAsync } from 'fastify'
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput
} from '../../types/database'

const TRANSACTION_COLUMNS =
  'id, amount::text, date::text, category_id, title, account_id'

function parseTransactionId (id: string): number | null {
  const parsed = Number(id)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function parseAmount (amount: unknown): string | null {
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) {
      return null
    }

    return amount.toFixed(2)
  }

  if (typeof amount === 'string' && amount.trim() !== '') {
    const parsed = Number(amount)
    if (!Number.isFinite(parsed)) {
      return null
    }

    return parsed.toFixed(2)
  }

  return null
}

function parseDate (date: unknown): string | null {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null
  }

  return date
}

function parseCategoryId (categoryId: unknown): number | null {
  const parsed = Number(categoryId)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function parseTitle (title: unknown): string | null | undefined {
  if (title === undefined) {
    return undefined
  }

  if (title === null) {
    return null
  }

  if (typeof title !== 'string') {
    return undefined
  }

  const trimmed = title.trim()
  return trimmed === '' ? null : trimmed
}

async function categoryExistsForAccount (
  fastify: Parameters<FastifyPluginAsync>[0],
  categoryId: number,
  accountId: number
): Promise<boolean> {
  const result = await fastify.pg.query(
    'SELECT id FROM categories WHERE id = $1 AND account_id = $2',
    [categoryId, accountId]
  )

  return result.rowCount !== null && result.rowCount > 0
}

const transactions: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (request, reply) => {
    const account = await fastify.requireAccount(request, reply)
    if (account === null) {
      return
    }

    const result = await fastify.pg.query<Transaction>(
      `SELECT ${TRANSACTION_COLUMNS} FROM transactions WHERE account_id = $1 ORDER BY date DESC, id DESC`,
      [account.id]
    )

    return result.rows
  })

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const account = await fastify.requireAccount(request, reply)
    if (account === null) {
      return
    }

    const id = parseTransactionId(request.params.id)

    if (id === null) {
      return reply.badRequest('Invalid transaction id')
    }

    const result = await fastify.pg.query<Transaction>(
      `SELECT ${TRANSACTION_COLUMNS} FROM transactions WHERE id = $1 AND account_id = $2`,
      [id, account.id]
    )

    if (result.rowCount === 0) {
      return reply.notFound('Transaction not found')
    }

    return result.rows[0]
  })

  fastify.post<{ Body: CreateTransactionInput }>('/', async (request, reply) => {
    const account = await fastify.requireAccount(request, reply)
    if (account === null) {
      return
    }

    const { amount, date, category_id: categoryId, title } = request.body ?? {}

    const parsedAmount = parseAmount(amount)
    const parsedDate = parseDate(date)
    const parsedCategoryId = parseCategoryId(categoryId)
    const parsedTitle = parseTitle(title)

    if (parsedAmount === null) {
      return reply.badRequest('Invalid amount')
    }

    if (parsedDate === null) {
      return reply.badRequest('Invalid date (expected YYYY-MM-DD)')
    }

    if (parsedCategoryId === null) {
      return reply.badRequest('Invalid category_id')
    }

    if (title !== undefined && parsedTitle === undefined) {
      return reply.badRequest('Invalid title')
    }

    if (!(await categoryExistsForAccount(fastify, parsedCategoryId, account.id))) {
      return reply.badRequest('Category not found')
    }

    const result = await fastify.pg.query<Transaction>(
      `INSERT INTO transactions (amount, date, category_id, title, account_id) VALUES ($1, $2, $3, $4, $5) RETURNING ${TRANSACTION_COLUMNS}`,
      [parsedAmount, parsedDate, parsedCategoryId, parsedTitle ?? null, account.id]
    )

    return reply.code(201).send(result.rows[0])
  })

  fastify.patch<{ Params: { id: string }, Body: UpdateTransactionInput }>(
    '/:id',
    async (request, reply) => {
      const account = await fastify.requireAccount(request, reply)
      if (account === null) {
        return
      }

      const id = parseTransactionId(request.params.id)

      if (id === null) {
        return reply.badRequest('Invalid transaction id')
      }

      const { amount, date, category_id: categoryId, title } = request.body ?? {}

      if (
        amount === undefined &&
        date === undefined &&
        categoryId === undefined &&
        title === undefined
      ) {
        return reply.badRequest('At least one field is required')
      }

      const existing = await fastify.pg.query<Transaction>(
        `SELECT ${TRANSACTION_COLUMNS} FROM transactions WHERE id = $1 AND account_id = $2`,
        [id, account.id]
      )

      if (existing.rowCount === 0) {
        return reply.notFound('Transaction not found')
      }

      const current = existing.rows[0]
      const parsedAmount = amount === undefined ? current.amount : parseAmount(amount)
      const parsedDate = date === undefined ? current.date : parseDate(date)
      const parsedCategoryId = categoryId === undefined
        ? current.category_id
        : parseCategoryId(categoryId)
      const parsedTitle = title === undefined ? current.title : parseTitle(title)

      if (parsedAmount === null) {
        return reply.badRequest('Invalid amount')
      }

      if (parsedDate === null) {
        return reply.badRequest('Invalid date (expected YYYY-MM-DD)')
      }

      if (parsedCategoryId === null) {
        return reply.badRequest('Invalid category_id')
      }

      if (title !== undefined && parsedTitle === undefined) {
        return reply.badRequest('Invalid title')
      }

      if (!(await categoryExistsForAccount(fastify, parsedCategoryId, account.id))) {
        return reply.badRequest('Category not found')
      }

      const result = await fastify.pg.query<Transaction>(
        `UPDATE transactions SET amount = $1, date = $2, category_id = $3, title = $4 WHERE id = $5 AND account_id = $6 RETURNING ${TRANSACTION_COLUMNS}`,
        [parsedAmount, parsedDate, parsedCategoryId, parsedTitle ?? null, id, account.id]
      )

      return result.rows[0]
    }
  )

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const account = await fastify.requireAccount(request, reply)
    if (account === null) {
      return
    }

    const id = parseTransactionId(request.params.id)

    if (id === null) {
      return reply.badRequest('Invalid transaction id')
    }

    const result = await fastify.pg.query(
      'DELETE FROM transactions WHERE id = $1 AND account_id = $2 RETURNING id',
      [id, account.id]
    )

    if (result.rowCount === 0) {
      return reply.notFound('Transaction not found')
    }

    return reply.code(204).send()
  })
}

export default transactions
