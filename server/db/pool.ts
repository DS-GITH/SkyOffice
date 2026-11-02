import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL não definida. Veja o arquivo .env.example')
}

// Railway's internal Postgres does not use SSL; external URLs (e.g. *.proxy.rlwy.net) do.
const needsSsl = /sslmode=require/.test(connectionString) || /rlwy\.net/.test(connectionString)

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
})

export async function query<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}
