/**
 * routes/library.js
 * My Library — gestión de overlays adquiridos por el usuario.
 */

import { Router } from 'express'
import { query, queryOne } from '../lib/db.js'
import { requireAuth } from '../lib/authExpress.js'

const router = Router()

// ─── GET /dashboard/library ───────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const { q, price, sort = 'newest' } = req.query
  const userId = req.user.id

  try {
    let sql = `
      SELECT p.id AS purchase_id, p.created_at AS purchased_at, p.status AS purchase_status,
             p.amount_paid, p.download_count, p.download_limit,
             o.id AS overlay_id, o.name, o.slug, o.short_description, o.preview_storage_ids,
             o.price AS original_price, o.tags, o.software_version, o.resolution,
             u.username AS creator_username, u.display_name AS creator_display_name
      FROM purchases p
      JOIN overlays o ON o.id = p.overlay_id
      JOIN users u ON u.id = o.creator_id
      WHERE p.buyer_id = ? AND p.status = 'COMPLETED'
    `
    const params = [userId]

    if (q) {
      sql += ' AND (o.name LIKE ? OR o.short_description LIKE ?)'
      params.push(`%${q}%`, `%${q}%`)
    }
    if (price === 'free') {
      sql += ' AND p.amount_paid = 0'
    } else if (price === 'paid') {
      sql += ' AND p.amount_paid > 0'
    }

    switch (sort) {
      case 'oldest': sql += ' ORDER BY p.created_at ASC'; break
      case 'name': sql += ' ORDER BY o.name ASC'; break
      default: sql += ' ORDER BY p.created_at DESC'
    }

    const purchases = await query(sql, params)

    res.render('dashboard_library', {
      title: 'My Library | SimplyOver',
      purchases,
      filters: { q, price, sort },
    })
  } catch (err) {
    console.error('[Library]', err)
    res.render('dashboard_library', {
      title: 'My Library | SimplyOver',
      purchases: [],
      filters: { q, price, sort },
    })
  }
})

// ─── DELETE /api/library/:purchaseId ──────────────────────────────────────────
router.delete('/api/library/:purchaseId', requireAuth, async (req, res) => {
  const { purchaseId } = req.params
  const userId = req.user.id

  try {
    const purchase = await queryOne(
      'SELECT id FROM purchases WHERE id = ? AND buyer_id = ?',
      [purchaseId, userId]
    )
    if (!purchase) return res.status(404).json({ error: 'Not found' })

    await query('DELETE FROM purchases WHERE id = ?', [purchaseId])
    res.json({ success: true })
  } catch (err) {
    console.error('[Library/Delete]', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── GET /api/library/:purchaseId/download ────────────────────────────────────
router.get('/api/library/:purchaseId/download', requireAuth, async (req, res) => {
  const { purchaseId } = req.params
  const userId = req.user.id

  try {
    const purchase = await queryOne(
      `SELECT p.download_token, p.download_count, p.download_limit, o.zip_storage_id, o.name
       FROM purchases p JOIN overlays o ON o.id = p.overlay_id
       WHERE p.id = ? AND p.buyer_id = ? AND p.status = 'COMPLETED'`,
      [purchaseId, userId]
    )
    if (!purchase) return res.status(404).json({ error: 'Not found' })
    if (purchase.download_count >= purchase.download_limit) {
      return res.status(403).json({ error: 'Download limit reached' })
    }

    // Incrementar contador
    await query('UPDATE purchases SET download_count = download_count + 1 WHERE id = ?', [purchaseId])

    // Redirigir a SpiderWeb storage URL
    const storageUrl = `${process.env.SPIDERWEBURL}/storage/files/${purchase.zip_storage_id}`
    res.redirect(storageUrl)
  } catch (err) {
    console.error('[Library/Download]', err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
