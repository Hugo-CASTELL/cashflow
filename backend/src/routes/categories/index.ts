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

const categories: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async () => {
    const result = await fastify.pg.query<Category>(
      'SELECT id, title, parent_id FROM categories ORDER BY id'
    )

    return result.rows
  })

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseCategoryId(request.params.id)

    if (id === null) {
      return reply.badRequest('Invalid category id')
    }

    const result = await fastify.pg.query<Category>(
      'SELECT id, title, parent_id FROM categories WHERE id = $1',
      [id]
    )

    if (result.rowCount === 0) {
      return reply.notFound('Category not found')
    }

    return result.rows[0]
  })

  fastify.post<{ Body: CreateCategoryInput }>('/', async (request, reply) => {
    const { title, parent_id: parentId } = request.body ?? {}

    if (typeof title !== 'string' || title.trim() === '') {
      return reply.badRequest('Title is required')
    }

    const parsedParentId = parseOptionalParentId(parentId)
    if (parsedParentId === null && parentId !== null && parentId !== undefined) {
      return reply.badRequest('Invalid parent_id')
    }

    if (parsedParentId !== undefined && parsedParentId !== null) {
      const parent = await fastify.pg.query(
        'SELECT id FROM categories WHERE id = $1',
        [parsedParentId]
      )

      if (parent.rowCount === 0) {
        return reply.badRequest('Parent category not found')
      }
    }

    const result = await fastify.pg.query<Category>(
      'INSERT INTO categories (title, parent_id) VALUES ($1, $2) RETURNING id, title, parent_id',
      [title.trim(), parsedParentId ?? null]
    )

    return reply.code(201).send(result.rows[0])
  })

  fastify.patch<{ Params: { id: string }, Body: UpdateCategoryInput }>(
    '/:id',
    async (request, reply) => {
      const id = parseCategoryId(request.params.id)

      if (id === null) {
        return reply.badRequest('Invalid category id')
      }

      const { title, parent_id: parentId } = request.body ?? {}

      if (title === undefined && parentId === undefined) {
        return reply.badRequest('At least one field is required')
      }

      if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
        return reply.badRequest('Title must be a non-empty string')
      }

      const parsedParentId = parseOptionalParentId(parentId)
      if (parsedParentId === null && parentId !== null && parentId !== undefined) {
        return reply.badRequest('Invalid parent_id')
      }

      if (parsedParentId !== undefined && parsedParentId !== null) {
        if (parsedParentId === id) {
          return reply.badRequest('Category cannot be its own parent')
        }

        const parent = await fastify.pg.query(
          'SELECT id FROM categories WHERE id = $1',
          [parsedParentId]
        )

        if (parent.rowCount === 0) {
          return reply.badRequest('Parent category not found')
        }
      }

      const existing = await fastify.pg.query<Category>(
        'SELECT id, title, parent_id FROM categories WHERE id = $1',
        [id]
      )

      if (existing.rowCount === 0) {
        return reply.notFound('Category not found')
      }

      const current = existing.rows[0]
      const nextTitle = title !== undefined ? title.trim() : current.title
      const nextParentId = parsedParentId !== undefined ? parsedParentId : current.parent_id

      const result = await fastify.pg.query<Category>(
        'UPDATE categories SET title = $1, parent_id = $2 WHERE id = $3 RETURNING id, title, parent_id',
        [nextTitle, nextParentId, id]
      )

      return result.rows[0]
    }
  )

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseCategoryId(request.params.id)

    if (id === null) {
      return reply.badRequest('Invalid category id')
    }

    const result = await fastify.pg.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rowCount === 0) {
      return reply.notFound('Category not found')
    }

    return reply.code(204).send()
  })
}

export default categories
