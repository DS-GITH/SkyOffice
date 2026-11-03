import jwt from 'jsonwebtoken'
import { query } from '../db/pool'

export type Role = 'admin' | 'member'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  avatar: string | null
}

const SECRET = process.env.JWT_SECRET
if (!SECRET) {
  throw new Error('JWT_SECRET não definido. Veja o arquivo .env.example')
}

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, SECRET!, { expiresIn: '30d' })
}

/** Validates the token and loads the user fresh from the DB (so deleted users lose access). */
export async function verifyToken(token: string | undefined | null): Promise<AuthUser | null> {
  if (!token) return null
  try {
    const payload = jwt.verify(token, SECRET!) as { sub?: string }
    if (!payload.sub) return null
    const rows = await query<AuthUser>(
      'SELECT id, email, name, role, avatar FROM users WHERE id = $1',
      [payload.sub]
    )
    return rows[0] ?? null
  } catch {
    return null
  }
}

/** Admins can enter every workspace; members only the ones they belong to. */
export async function canAccessWorkspace(user: AuthUser, workspaceId: string) {
  if (user.role === 'admin') {
    const rows = await query('SELECT 1 FROM workspaces WHERE id = $1', [workspaceId])
    return rows.length > 0
  }
  const rows = await query(
    'SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
    [workspaceId, user.id]
  )
  return rows.length > 0
}
