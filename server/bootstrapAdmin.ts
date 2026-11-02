import bcrypt from 'bcrypt'
import { query } from './db/pool'

/**
 * Keeps the admin account in sync with the ADMIN_* env vars on every boot:
 * - creates it if the e-mail doesn't exist yet;
 * - if it exists, makes sure it is admin and that the password matches ADMIN_PASSWORD
 *   (so changing the env var on Railway changes the admin password after the redeploy).
 */
export async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME?.trim() || 'Admin'

  if (!email || !password) {
    const admins = await query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1")
    if (!admins.length) {
      console.warn('[admin] Nenhum admin existe e ADMIN_EMAIL/ADMIN_PASSWORD não foram definidos.')
    }
    return
  }

  const rows = await query<{ id: string; role: string; password_hash: string }>(
    'SELECT id, role, password_hash FROM users WHERE email = $1',
    [email]
  )
  const existing = rows[0]

  if (!existing) {
    const hash = await bcrypt.hash(password, 10)
    await query(
      `INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
      [email, name, hash]
    )
    console.log(`[admin] Admin criado: ${email}`)
    return
  }

  const samePassword = await bcrypt.compare(password, existing.password_hash)
  if (!samePassword) {
    const hash = await bcrypt.hash(password, 10)
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, existing.id])
    console.log(`[admin] Senha do admin atualizada a partir de ADMIN_PASSWORD: ${email}`)
  }
  if (existing.role !== 'admin') {
    await query("UPDATE users SET role = 'admin' WHERE id = $1", [existing.id])
    console.log(`[admin] ${email} promovido a admin`)
  }
}
