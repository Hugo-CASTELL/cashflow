import { type FastifyPluginAsync } from 'fastify'
import type { Transaction } from '../../types/database'

const transactions: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async () => {
    const result = await fastify.pg.query<Transaction>(
      'SELECT id, amount::text, date::text, category_id FROM transactions ORDER BY date DESC, id DESC'
    )

    return result.rows
  })

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = Number(request.params.id)

    if (!Number.isInteger(id) || id <= 0) {
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
}

export default transactions
