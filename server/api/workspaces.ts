import { Router } from 'express'
import { matchMaker } from 'colyseus'
import { query } from '../db/pool'
import { requireAuth, requireAdmin, wrap } from '../auth/middleware'
import { RoomType } from '../../types/Rooms'

const router = Router()
router.use(requireAuth)

/** Number of connected people per workspace, from the live Colyseus rooms. */
async function onlineCounts() {
  const rooms = await matchMaker.query({ name: RoomType.WORKSPACE })
  const counts = new Map<string, number>()
  rooms.forEach((room) => {
    const id = room.metadata?.workspaceId
    if (id) counts.set(id, (counts.get(id) || 0) + room.clients)
  })
  return counts
}

router.get(
  '/',
  wrap(async (req, res) => {
    const user = req.user!
    const workspaces =
      user.role === 'admin'
        ? await query(
            `SELECT w.id, w.name, w.description, w.created_at,
               COALESCE(array_agg(m.user_id) FILTER (WHERE m.user_id IS NOT NULL), '{}') AS member_ids
             FROM workspaces w LEFT JOIN workspace_members m ON m.workspace_id = w.id
             GROUP BY w.id ORDER BY w.created_at`
          )
        : await query(
            `SELECT w.id, w.name, w.description, w.created_at
             FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id
             WHERE m.user_id = $1 ORDER BY w.created_at`,
            [user.id]
          )
    const counts = await onlineCounts()
    res.json({
      workspaces: workspaces.map((w: any) => ({ ...w, online: counts.get(w.id) || 0 })),
    })
  })
)

router.post(
  '/',
  requireAdmin,
  wrap(async (req, res) => {
    const name = String(req.body?.name || '').trim()
    const description = String(req.body?.description || '').trim()
    if (!name) return res.status(400).json({ error: 'Dê um nome ao workspace' })
    if (name.length > 60) return res.status(400).json({ error: 'Nome muito longo (máx. 60)' })
    const rows = await query(
      'INSERT INTO workspaces (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at',
      [name, description.slice(0, 280)]
    )
    res.status(201).json({ workspace: { ...rows[0], member_ids: [], online: 0 } })
  })
)

router.delete(
  '/:id',
  requireAdmin,
  wrap(async (req, res) => {
    await query('DELETE FROM workspaces WHERE id = $1', [req.params.id])
    res.status(204).end()
  })
)

/** Replaces the member list of a workspace. */
router.put(
  '/:id/members',
  requireAdmin,
  wrap(async (req, res) => {
    const userIds: string[] = Array.isArray(req.body?.userIds) ? req.body.userIds.map(String) : []
    const workspaceId = req.params.id
    await query('DELETE FROM workspace_members WHERE workspace_id = $1', [workspaceId])
    if (userIds.length) {
      await query(
        `INSERT INTO workspace_members (workspace_id, user_id)
         SELECT $1, u.id FROM users u WHERE u.id = ANY($2::uuid[])
         ON CONFLICT DO NOTHING`,
        [workspaceId, userIds]
      )
    }
    res.status(204).end()
  })
)

export default router
