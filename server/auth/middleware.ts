import { Request, Response, NextFunction } from 'express'
import { AuthUser, verifyToken } from './jwt'

export interface AuthedRequest extends Request {
  user?: AuthUser
}

type Handler = (req: AuthedRequest, res: Response, next: NextFunction) => unknown

/** Wraps async route handlers so thrown errors become 500 responses instead of crashes. */
export const wrap =
  (fn: Handler) => (req: AuthedRequest, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next)

export const requireAuth = wrap(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  const user = await verifyToken(token)
  if (!user) return res.status(401).json({ error: 'Sessão inválida ou expirada' })
  req.user = user
  next()
})

export const requireAdmin = (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas o administrador pode fazer isso' })
  }
  next()
}
