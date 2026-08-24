/**
 * routes/favorites.js
 * API para gestionar favoritos del usuario.
 */

import { Router } from 'express'
import { query, queryOne } from '../lib/db.js'
import { requireAuth } from '../lib/authExpress.js'

const router = Router()

// ─── POST /api/favorites ──────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { overlayId } = req.body
  const userId = req.user.id

  if (!overlayId) return res.status(400).json({ error: 'overlayId is required' })

  try {
    const exists = await queryOne(
      'SELECT overlay_id FROM favorites WHERE user_id = ? AND overlay_id = ?',
      [userId, overlayId]
    )

    if (exists) {
      await query('DELETE FROM favorites WHERE user_id = ? AND overlay_id = ?', [userId, overlayId])
      return res.json({ success: true, action: 'removed' })
    } else {
      await query(
        'INSERT INTO favorites (user_id, overlay_id, created_at) VALUES (?, ?, NOW())',
        [userId, overlayId]
      )
      return res.json({ success: true, action: 'added' })
    }
  } catch (err) {
    console.error('[Favorites]', err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
