import { type FastifyPluginAsync } from 'fastify'
import type { Category } from '../../types/database'

const categories: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async () => {
    const result = await fastify.pg.query<Category>(
      'SELECT id, title, parent_id FROM categories ORDER BY id'
    )

    return result.rows
  })

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = Number(request.params.id)

    if (!Number.isInteger(id) || id <= 0) {
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
}

export default categories
