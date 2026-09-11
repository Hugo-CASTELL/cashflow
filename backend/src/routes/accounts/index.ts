import { type FastifyPluginAsync } from 'fastify'
import { ACCOUNT_COLUMNS, type Account, type PublicAccount } from '../../plugins/auth'
import {
  parseBudgetDisplay,
  parseChartType,
  parseCurrency
} from '../../lib/account-settings'

interface CreateAccountBody {
  name?: string
}

interface AuthBody {
  secret?: string
}

interface UpdateSettingsBody {
  currency?: string
  budget_display?: string
  chart_type?: string
}

function toPublicAccount (account: Account): PublicAccount {
  return {
    id: account.id,
    name: account.name,
    currency: account.currency,
    budget_display: account.budget_display,
    chart_type: account.chart_type
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
      `INSERT INTO accounts (name, secret) VALUES ($1, $2) RETURNING ${ACCOUNT_COLUMNS}`,
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
      `SELECT ${ACCOUNT_COLUMNS} FROM accounts WHERE secret = $1`,
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

  fastify.patch<{ Body: UpdateSettingsBody }>('/me', async (request, reply) => {
    const account = await fastify.requireAccount(request, reply)
    if (account === null) {
      return
    }

    const {
      currency,
      budget_display: budgetDisplay,
      chart_type: chartType
    } = request.body ?? {}

    if (currency === undefined && budgetDisplay === undefined && chartType === undefined) {
      return reply.badRequest('At least one field is required')
    }

    const nextCurrency = currency === undefined ? account.currency : parseCurrency(currency)
    if (nextCurrency === null) {
      return reply.badRequest('Invalid currency: expected a three-letter ISO 4217 code')
    }

    const nextBudgetDisplay =
      budgetDisplay === undefined ? account.budget_display : parseBudgetDisplay(budgetDisplay)
    if (nextBudgetDisplay === null) {
      return reply.badRequest('Invalid budget_display: expected "percent" or "currency"')
    }

    const nextChartType = chartType === undefined ? account.chart_type : parseChartType(chartType)
    if (nextChartType === null) {
      return reply.badRequest('Invalid chart_type: expected "donut", "pie" or "bar"')
    }

    const result = await fastify.pg.query<Account>(
      `UPDATE accounts SET currency = $1, budget_display = $2, chart_type = $3 WHERE id = $4 RETURNING ${ACCOUNT_COLUMNS}`,
      [nextCurrency, nextBudgetDisplay, nextChartType, account.id]
    )

    return toPublicAccount(result.rows[0])
  })
}

export default accounts
