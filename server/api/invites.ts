import { Router } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { pool, query } from '../db/pool'
import { signToken } from '../auth/jwt'
import { requireAuth, requireAdmin, wrap } from '../auth/middleware'

const router = Router()
const INVITE_DAYS = 7

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

/** Valid = exists, not accepted and not expired. */
async function findValidInvite(token: string) {
  const rows = await query(
    `SELECT id, email, workspace_ids FROM invites
     WHERE token_hash = $1 AND accepted_at IS NULL AND expires_at > now()`,
    [hashToken(token)]
  )
  return rows[0] as { id: string; email: string; workspace_ids: string[] } | undefined
}

// ---- Public: used by the invite page ----

router.get(
  '/token/:token',
  wrap(async (req, res) => {
    const invite = await findValidInvite(req.params.token)
    if (!invite) return res.status(404).json({ error: 'Convite inválido ou expirado' })
    const workspaces = await query('SELECT name FROM workspaces WHERE id = ANY($1::uuid[])', [
      invite.workspace_ids,
    ])
    res.json({ email: invite.email, workspaces: workspaces.map((w: any) => w.name) })
  })
)

router.post(
  '/token/:token/accept',
  wrap(async (req, res) => {
    const name = String(req.body?.name || '').trim()
    const password = String(req.body?.password || '')
    if (!name) return res.status(400).json({ error: 'Informe seu nome' })
    if (name.length > 40) return res.status(400).json({ error: 'Nome muito longo (máx. 40)' })
    if (password.length < 8) {
      return res.status(400).json({ error: 'A senha precisa ter pelo menos 8 caracteres' })
    }

    const invite = await findValidInvite(req.params.token)
    if (!invite) return res.status(404).json({ error: 'Convite inválido ou expirado' })

    const exists = await query('SELECT 1 FROM users WHERE email = $1', [invite.email])
    if (exists.length) {
      return res.status(409).json({ error: 'Já existe uma conta com este e-mail. Faça login.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        `INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, 'member')
         RETURNING id, email, name, role, avatar`,
        [invite.email, name, passwordHash]
      )
      const user = rows[0]
      await client.query(
        `INSERT INTO workspace_members (workspace_id, user_id)
         SELECT w.id, $2 FROM workspaces w WHERE w.id = ANY($1::uuid[])
         ON CONFLICT DO NOTHING`,
        [invite.workspace_ids, user.id]
      )
      await client.query('UPDATE invites SET accepted_at = now() WHERE id = $1', [invite.id])
      await client.query('COMMIT')
      res.status(201).json({ token: signToken(user.id), user })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  })
)

// ---- Admin ----

router.get(
  '/',
  requireAuth,
  requireAdmin,
  wrap(async (_req, res) => {
    const invites = await query(
      `SELECT id, email, workspace_ids, expires_at, created_at FROM invites
       WHERE accepted_at IS NULL AND expires_at > now() ORDER BY created_at DESC`
    )
    res.json({ invites })
  })
)

router.post(
  '/',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const workspaceIds: string[] = Array.isArray(req.body?.workspaceIds)
      ? req.body.workspaceIds.map(String)
      : []
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'E-mail inválido' })
    }
    if (!workspaceIds.length) {
      return res.status(400).json({ error: 'Escolha pelo menos um workspace' })
    }
    const exists = await query('SELECT 1 FROM users WHERE email = $1', [email])
    if (exists.length) {
      return res
        .status(409)
        .json({ error: 'Essa pessoa já tem conta. Use "Gerenciar membros" no menu do workspace.' })
    }

    // A new invite for the same e-mail replaces older pending ones.
    await query('DELETE FROM invites WHERE email = $1 AND accepted_at IS NULL', [email])

    const token = crypto.randomBytes(32).toString('base64url')
    const rows = await query(
      `INSERT INTO invites (token_hash, email, workspace_ids, expires_at)
       VALUES ($1, $2, $3::uuid[], now() + ($4 || ' days')::interval)
       RETURNING id, email, workspace_ids, expires_at, created_at`,
      [hashToken(token), email, workspaceIds, String(INVITE_DAYS)]
    )
    // The raw token is only returned once; the DB keeps just its hash.
    res.status(201).json({ invite: rows[0], path: `/convite/${token}` })
  })
)

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    await query('DELETE FROM invites WHERE id = $1', [req.params.id])
    res.status(204).end()
  })
)

export default router
