import { join } from 'node:path'
import fp from 'fastify-plugin'
import { Pool } from 'pg'
import { runMigrations } from '../lib/migrations'

export interface DatabasePluginOptions {
  connectionString?: string
}

function getConnectionString (connectionString?: string): string {
  if (connectionString) {
    return connectionString
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const user = process.env.POSTGRES_USER ?? 'cashflow'
  const password = process.env.POSTGRES_PASSWORD ?? 'cashflow'
  const host = process.env.POSTGRES_HOST ?? 'localhost'
  const port = process.env.POSTGRES_PORT ?? '5432'
  const database = process.env.POSTGRES_DB ?? 'cashflow'

  return `postgresql://${user}:${password}@${host}:${port}/${database}`
}

async function waitForDatabase (pool: Pool, retries = 30, delayMs = 1000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1')
      return
    } catch (error) {
      if (attempt === retries) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

export default fp<DatabasePluginOptions>(async (fastify, opts) => {
  if (process.env.SKIP_DATABASE_CONNECT === 'true') {
    fastify.decorate('pg', {
      query: async () => {
        throw new Error('Database not available in tests')
      },
      end: async () => {}
    } as unknown as Pool)

    return
  }

  const pool = new Pool({
    connectionString: getConnectionString(opts.connectionString)
  })

  await waitForDatabase(pool)
  fastify.decorate('pg', pool)

  const migrationsDir = join(__dirname, '..', '..', 'migrations')
  await runMigrations(pool, migrationsDir)

  fastify.addHook('onClose', async () => {
    await pool.end()
  })
})

declare module 'fastify' {
  export interface FastifyInstance {
    pg: Pool
  }
}
