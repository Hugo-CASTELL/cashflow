import { type FastifyPluginAsync } from 'fastify'
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput
} from '../../types/database'

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

async function categoryExists (
  fastify: Parameters<FastifyPluginAsync>[0],
  categoryId: number
): Promise<boolean> {
  const result = await fastify.pg.query(
    'SELECT id FROM categories WHERE id = $1',
    [categoryId]
  )

  return result.rowCount !== null && result.rowCount > 0
}

const transactions: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async () => {
    const result = await fastify.pg.query<Transaction>(
      'SELECT id, amount::text, date::text, category_id FROM transactions ORDER BY date DESC, id DESC'
    )

    return result.rows
  })

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseTransactionId(request.params.id)

    if (id === null) {
      return reply.badRequest('Invalid transaction id')
    }

    const result = await fastify.pg.query<Transaction>(
      'SELECT id, amount::text, date::text, category_id FROM transactions WHERE id = $1',
      [id]
    )

    if (result.rowCount === 0) {
      return reply.notFound('Transaction not found')
    }

    return result.rows[0]
  })

  fastify.post<{ Body: CreateTransactionInput }>('/', async (request, reply) => {
    const { amount, date, category_id: categoryId } = request.body ?? {}

    const parsedAmount = parseAmount(amount)
    const parsedDate = parseDate(date)
    const parsedCategoryId = parseCategoryId(categoryId)

    if (parsedAmount === null) {
      return reply.badRequest('Invalid amount')
    }

    if (parsedDate === null) {
      return reply.badRequest('Invalid date (expected YYYY-MM-DD)')
    }

    if (parsedCategoryId === null) {
      return reply.badRequest('Invalid category_id')
    }

    if (!(await categoryExists(fastify, parsedCategoryId))) {
      return reply.badRequest('Category not found')
    }

    const result = await fastify.pg.query<Transaction>(
      'INSERT INTO transactions (amount, date, category_id) VALUES ($1, $2, $3) RETURNING id, amount::text, date::text, category_id',
      [parsedAmount, parsedDate, parsedCategoryId]
    )

    return reply.code(201).send(result.rows[0])
  })

  fastify.patch<{ Params: { id: string }, Body: UpdateTransactionInput }>(
    '/:id',
    async (request, reply) => {
      const id = parseTransactionId(request.params.id)

      if (id === null) {
        return reply.badRequest('Invalid transaction id')
      }

      const { amount, date, category_id: categoryId } = request.body ?? {}

      if (amount === undefined && date === undefined && categoryId === undefined) {
        return reply.badRequest('At least one field is required')
      }

      const existing = await fastify.pg.query<Transaction>(
        'SELECT id, amount::text, date::text, category_id FROM transactions WHERE id = $1',
        [id]
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

      if (parsedAmount === null) {
        return reply.badRequest('Invalid amount')
      }

      if (parsedDate === null) {
        return reply.badRequest('Invalid date (expected YYYY-MM-DD)')
      }

      if (parsedCategoryId === null) {
        return reply.badRequest('Invalid category_id')
      }

      if (!(await categoryExists(fastify, parsedCategoryId))) {
        return reply.badRequest('Category not found')
      }

      const result = await fastify.pg.query<Transaction>(
        'UPDATE transactions SET amount = $1, date = $2, category_id = $3 WHERE id = $4 RETURNING id, amount::text, date::text, category_id',
        [parsedAmount, parsedDate, parsedCategoryId, id]
      )

      return result.rows[0]
    }
  )

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseTransactionId(request.params.id)

    if (id === null) {
      return reply.badRequest('Invalid transaction id')
    }

    const result = await fastify.pg.query(
      'DELETE FROM transactions WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rowCount === 0) {
      return reply.notFound('Transaction not found')
    }

    return reply.code(204).send()
  })
}

export default transactions
