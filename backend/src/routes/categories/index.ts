import { type FastifyPluginAsync } from 'fastify'
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput
} from '../../types/database'

function parseCategoryId (id: string): number | null {
  const parsed = Number(id)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function parseOptionalParentId (parentId: unknown): number | null | undefined {
  if (parentId === undefined) {
    return undefined
  }

  if (parentId === null) {
    return null
  }

  const parsed = Number(parentId)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

const INVALID_BUDGET = Symbol('invalid-budget')

function parseOptionalBudget (
  budget: unknown
): string | null | undefined | typeof INVALID_BUDGET {
  if (budget === undefined) {
    return undefined
  }

  if (budget === null || budget === '') {
    return null
  }

  if (typeof budget === 'number') {
    if (!Number.isFinite(budget) || budget < 0) {
      return INVALID_BUDGET
    }

    return budget.toFixed(2)
  }

  if (typeof budget === 'string' && budget.trim() !== '') {
    const parsed = Number(budget)
    if (!Number.isFinite(parsed) || parsed < 0) {
      return INVALID_BUDGET
    }

    return parsed.toFixed(2)
  }

  return INVALID_BUDGET
}

const CATEGORY_COLUMNS =
  'id, title, parent_id, monthly_budget::text AS monthly_budget, account_id'

const categories: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (request, reply) => {
    const account = await fastify.requireAccount(request, reply)
    if (account === null) {
      return
    }

    const result = await fastify.pg.query<Category>(
      `SELECT ${CATEGORY_COLUMNS} FROM categories WHERE account_id = $1 ORDER BY id`,
      [account.id]
    )

    return result.rows
  })

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const account = await fastify.requireAccount(request, reply)
    if (account === null) {
      return
    }

    const id = parseCategoryId(request.params.id)

    if (id === null) {
      return reply.badRequest('Invalid category id')
    }

    const result = await fastify.pg.query<Category>(
      `SELECT ${CATEGORY_COLUMNS} FROM categories WHERE id = $1 AND account_id = $2`,
      [id, account.id]
    )

    if (result.rowCount === 0) {
      return reply.notFound('Category not found')
    }

    return result.rows[0]
  })

  fastify.post<{ Body: CreateCategoryInput }>('/', async (request, reply) => {
    const account = await fastify.requireAccount(request, reply)
    if (account === null) {
      return
    }

    const { title, parent_id: parentId, monthly_budget: monthlyBudget } = request.body ?? {}

    if (typeof title !== 'string' || title.trim() === '') {
      return reply.badRequest('Title is required')
    }

    const parsedParentId = parseOptionalParentId(parentId)
    if (parsedParentId === null && parentId !== null && parentId !== undefined) {
      return reply.badRequest('Invalid parent_id')
    }

    const parsedBudget = parseOptionalBudget(monthlyBudget)
    if (parsedBudget === INVALID_BUDGET) {
      return reply.badRequest('Invalid monthly_budget')
    }

    if (parsedParentId !== undefined && parsedParentId !== null) {
      const parent = await fastify.pg.query(
        'SELECT id FROM categories WHERE id = $1 AND account_id = $2',
        [parsedParentId, account.id]
      )

      if (parent.rowCount === 0) {
        return reply.badRequest('Parent category not found')
      }
    }

    const result = await fastify.pg.query<Category>(
      `INSERT INTO categories (title, parent_id, monthly_budget, account_id) VALUES ($1, $2, $3, $4) RETURNING ${CATEGORY_COLUMNS}`,
      [title.trim(), parsedParentId ?? null, parsedBudget ?? null, account.id]
    )

    return reply.code(201).send(result.rows[0])
  })

  fastify.patch<{ Params: { id: string }, Body: UpdateCategoryInput }>(
    '/:id',
    async (request, reply) => {
      const account = await fastify.requireAccount(request, reply)
      if (account === null) {
        return
      }

      const id = parseCategoryId(request.params.id)

      if (id === null) {
        return reply.badRequest('Invalid category id')
      }

      const { title, parent_id: parentId, monthly_budget: monthlyBudget } = request.body ?? {}

      if (title === undefined && parentId === undefined && monthlyBudget === undefined) {
        return reply.badRequest('At least one field is required')
      }

      if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
        return reply.badRequest('Title must be a non-empty string')
      }

      const parsedParentId = parseOptionalParentId(parentId)
      if (parsedParentId === null && parentId !== null && parentId !== undefined) {
        return reply.badRequest('Invalid parent_id')
      }

      const parsedBudget = parseOptionalBudget(monthlyBudget)
      if (parsedBudget === INVALID_BUDGET) {
        return reply.badRequest('Invalid monthly_budget')
      }

      if (parsedParentId !== undefined && parsedParentId !== null) {
        if (parsedParentId === id) {
          return reply.badRequest('Category cannot be its own parent')
        }

        const parent = await fastify.pg.query(
          'SELECT id FROM categories WHERE id = $1 AND account_id = $2',
          [parsedParentId, account.id]
        )

        if (parent.rowCount === 0) {
          return reply.badRequest('Parent category not found')
        }
      }

      const existing = await fastify.pg.query<Category>(
        `SELECT ${CATEGORY_COLUMNS} FROM categories WHERE id = $1 AND account_id = $2`,
        [id, account.id]
      )

      if (existing.rowCount === 0) {
        return reply.notFound('Category not found')
      }

      const current = existing.rows[0]
      const nextTitle = title !== undefined ? title.trim() : current.title
      const nextParentId = parsedParentId !== undefined ? parsedParentId : current.parent_id
      const nextBudget = parsedBudget !== undefined ? parsedBudget : current.monthly_budget

      const result = await fastify.pg.query<Category>(
        `UPDATE categories SET title = $1, parent_id = $2, monthly_budget = $3 WHERE id = $4 AND account_id = $5 RETURNING ${CATEGORY_COLUMNS}`,
        [nextTitle, nextParentId, nextBudget, id, account.id]
      )

      return result.rows[0]
    }
  )

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const account = await fastify.requireAccount(request, reply)
    if (account === null) {
      return
    }

    const id = parseCategoryId(request.params.id)

    if (id === null) {
      return reply.badRequest('Invalid category id')
    }

    const existing = await fastify.pg.query(
      'SELECT id FROM categories WHERE id = $1 AND account_id = $2',
      [id, account.id]
    )

    if (existing.rowCount === 0) {
      return reply.notFound('Category not found')
    }

    const linked = await fastify.pg.query(
      'SELECT id FROM transactions WHERE category_id = $1 AND account_id = $2 LIMIT 1',
      [id, account.id]
    )

    if (linked.rowCount && linked.rowCount > 0) {
      return reply.conflict('Category has transactions; delete them first')
    }

    const result = await fastify.pg.query(
      'DELETE FROM categories WHERE id = $1 AND account_id = $2 RETURNING id',
      [id, account.id]
    )

    if (result.rowCount === 0) {
      return reply.notFound('Category not found')
    }

    return reply.code(204).send()
  })
}

export default categories
