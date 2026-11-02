import { Router } from 'express'
import { query } from '../db/pool'
import { requireAuth, requireAdmin, wrap } from '../auth/middleware'

const router = Router()
router.use(requireAuth, requireAdmin)

router.get(
  '/',
  wrap(async (_req, res) => {
    const users = await query(
      `SELECT u.id, u.email, u.name, u.role, u.created_at,
         COALESCE(array_agg(m.workspace_id) FILTER (WHERE m.workspace_id IS NOT NULL), '{}') AS workspace_ids
       FROM users u LEFT JOIN workspace_members m ON m.user_id = u.id
       GROUP BY u.id ORDER BY u.created_at`
    )
    res.json({ users })
  })
)

router.delete(
  '/:id',
  wrap(async (req, res) => {
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: 'Você não pode remover a si mesmo' })
    }
    await query("DELETE FROM users WHERE id = $1 AND role <> 'admin'", [req.params.id])
    res.status(204).end()
  })
)

export default router
