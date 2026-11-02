import { Router } from 'express'
import bcrypt from 'bcrypt'
import { query } from '../db/pool'
import { signToken, AuthUser } from '../auth/jwt'
import { requireAuth, wrap } from '../auth/middleware'

const router = Router()

// Simple in-memory brute-force protection: 10 failed attempts per IP+email per 15 min.
const failures = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 10

function isBlocked(key: string) {
  const entry = failures.get(key)
  if (!entry) return false
  if (Date.now() > entry.resetAt) {
    failures.delete(key)
    return false
  }
  return entry.count >= MAX_FAILURES
}

function registerFailure(key: string) {
  const entry = failures.get(key)
  if (!entry || Date.now() > entry.resetAt) {
    failures.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS })
  } else {
    entry.count++
  }
}

router.post(
  '/login',
  wrap(async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha' })

    const key = `${req.ip}:${email}`
    if (isBlocked(key)) {
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' })
    }

    const rows = await query<AuthUser & { password_hash: string }>(
      'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
      [email]
    )
    const user = rows[0]
    const ok = user ? await bcrypt.compare(password, user.password_hash) : false
    if (!user || !ok) {
      registerFailure(key)
      return res.status(401).json({ error: 'E-mail ou senha incorretos' })
    }

    failures.delete(key)
    const { password_hash, ...publicUser } = user
    res.json({ token: signToken(user.id), user: publicUser })
  })
)

router.get('/me', requireAuth, (req: any, res) => {
  res.json({ user: req.user })
})

export default router
