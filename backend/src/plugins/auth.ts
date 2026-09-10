import { randomBytes } from 'node:crypto'
import fp from 'fastify-plugin'
import type { FastifyReply, FastifyRequest } from 'fastify'
// Ensure Fastify module augmentations (pg, sensible helpers) are visible to ts-node.
import './database'
import './sensible'

export interface Account {
  id: number
  name: string
  secret: string
}

export type PublicAccount = Omit<Account, 'secret'>

declare module 'fastify' {
  export interface FastifyRequest {
    account: Account | null
  }

  export interface FastifyInstance {
    generateAccountSecret: () => string
    authenticateRequest: (request: FastifyRequest, reply: FastifyReply) => Promise<Account | null>
    requireAccount: (request: FastifyRequest, reply: FastifyReply) => Promise<Account | null>
  }
}

function extractSecret (request: FastifyRequest): string | null {
  const authorization = request.headers.authorization

  if (typeof authorization === 'string') {
    const bearerMatch = /^Bearer\s+(.+)$/i.exec(authorization.trim())
    if (bearerMatch?.[1]) {
      const token = bearerMatch[1].trim()
      return token === '' ? null : token
    }
  }

  const headerSecret = request.headers['x-account-secret']
  if (typeof headerSecret === 'string') {
    const token = headerSecret.trim()
    return token === '' ? null : token
  }

  return null
}

export default fp(async (fastify) => {
  fastify.decorateRequest('account', null)

  fastify.decorate('generateAccountSecret', () => {
    return randomBytes(32).toString('hex')
  })

  fastify.decorate(
    'authenticateRequest',
    async (request: FastifyRequest, _reply: FastifyReply): Promise<Account | null> => {
      const secret = extractSecret(request)
      if (secret === null) {
        request.account = null
        return null
      }

      const result = await fastify.pg.query<Account>(
        'SELECT id, name, secret FROM accounts WHERE secret = $1',
        [secret]
      )

      const account = result.rows[0] ?? null
      request.account = account
      return account
    }
  )

  fastify.decorate(
    'requireAccount',
    async (request: FastifyRequest, reply: FastifyReply): Promise<Account | null> => {
      const account = await fastify.authenticateRequest(request, reply)
      if (account === null) {
        await reply.unauthorized('Valid account secret required')
        return null
      }

      return account
    }
  )
})
