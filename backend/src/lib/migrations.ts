import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Pool, PoolClient } from 'pg'

const MIGRATIONS_TABLE = 'schema_migrations'

async function ensureMigrationsTable (client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function getAppliedMigrations (client: PoolClient): Promise<Set<string>> {
  const result = await client.query<{ name: string }>(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id`
  )

  return new Set(result.rows.map((row) => row.name))
}

export async function runMigrations (pool: Pool, migrationsDir: string): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await ensureMigrationsTable(client)

    const applied = await getAppliedMigrations(client)
    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort()

    for (const file of files) {
      if (applied.has(file)) {
        continue
      }

      const sql = await readFile(join(migrationsDir, file), 'utf8')
      await client.query(sql)
      await client.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`,
        [file]
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
