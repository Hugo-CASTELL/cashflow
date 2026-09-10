import { type FastifyPluginAsync } from 'fastify'
import type { Account, PublicAccount } from '../../plugins/auth'

interface CreateAccountBody {
  name?: string
}

interface AuthBody {
  secret?: string
}

function toPublicAccount (account: Account): PublicAccount {
  return {
    id: account.id,
    name: account.name
  }
}

const accounts: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: CreateAccountBody }>('/', async (request, reply) => {
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : ''

    if (name === '') {
      return reply.badRequest('Name is required')
    }

    if (name.length > 255) {
      return reply.badRequest('Name must be 255 characters or fewer')
    }

    const secret = fastify.generateAccountSecret()
    const result = await fastify.pg.query<Account>(
      'INSERT INTO accounts (name, secret) VALUES ($1, $2) RETURNING id, name, secret',
      [name, secret]
    )

    return reply.code(201).send(result.rows[0])
  })

  fastify.post<{ Body: AuthBody }>('/auth', async (request, reply) => {
    const secret = typeof request.body?.secret === 'string' ? request.body.secret.trim() : ''

    if (secret === '') {
      return reply.badRequest('Secret is required')
    }

    const result = await fastify.pg.query<Account>(
      'SELECT id, name, secret FROM accounts WHERE secret = $1',
      [secret]
    )

    if (result.rowCount === 0) {
      return reply.unauthorized('Invalid account secret')
    }

    return toPublicAccount(result.rows[0])
  })

  fastify.get('/me', async (request, reply) => {
    const account = await fastify.requireAccount(request, reply)
    if (account === null) {
      return
    }

    return toPublicAccount(account)
  })
}

export default accounts
