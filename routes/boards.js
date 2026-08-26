/**
 * routes/boards.js
 * My Boards — gestión de tableros del usuario con sistema de etiquetas.
 */

import { Router } from 'express'
import { query, queryOne, generateUUID } from '../lib/db.js'
import { requireAuth } from '../lib/authExpress.js'

const router = Router()

// ─── GET /dashboard/boards ────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const { q, tag } = req.query
  const userId = req.user.id

  try {
    let sql = `
      SELECT b.id, b.name, b.description, b.visibility, b.cover_storage_id,
             b.created_at, b.updated_at,
             COUNT(bi.overlay_id) AS item_count,
             GROUP_CONCAT(bt.tag ORDER BY bt.tag SEPARATOR ',') AS tags_raw
      FROM boards b
      LEFT JOIN board_items bi ON bi.board_id = b.id
      LEFT JOIN board_tags bt ON bt.board_id = b.id
      WHERE b.owner_id = ?
    `
    const params = [userId]

    if (q) {
      sql += ' AND b.name LIKE ?'
      params.push(`%${q}%`)
    }

    sql += ' GROUP BY b.id ORDER BY b.updated_at DESC'

    let boards = await query(sql, params)
    boards = boards.map(b => ({
      ...b,
      tags: b.tags_raw ? b.tags_raw.split(',') : [],
    }))

    // Filtrar por tag del lado del servidor si se pidió
    if (tag) {
      boards = boards.filter(b => b.tags.includes(tag))
    }

    // Obtener los overlays preview de cada board (hasta 4)
    for (const board of boards) {
      const items = await query(
        `SELECT o.preview_storage_ids FROM board_items bi
         JOIN overlays o ON o.id = bi.overlay_id
         WHERE bi.board_id = ?
         LIMIT 4`,
        [board.id]
      )
      board.preview_images = items.map(i => {
        try {
          const ids = JSON.parse(i.preview_storage_ids || '[]')
          return ids[0] ? `${process.env.SPIDERWEBURL}/storage/files/${ids[0]}` : null
        } catch { return null }
      }).filter(Boolean)
    }

    // Obtener todas las tags únicas del usuario para el filtro
    const allTagsRows = await query(
      `SELECT DISTINCT bt.tag FROM board_tags bt
       JOIN boards b ON b.id = bt.board_id
       WHERE b.owner_id = ?
       ORDER BY bt.tag`,
      [userId]
    )
    const allTags = allTagsRows.map(r => r.tag)

    res.render('dashboard_boards', {
      title: 'My Boards | SimplyOver',
      boards,
      allTags,
      filters: { q, tag },
    })
  } catch (err) {
    console.error('[Boards]', err)
    res.render('dashboard_boards', {
      title: 'My Boards | SimplyOver',
      boards: [],
      allTags: [],
      filters: { q, tag },
    })
  }
})

// ─── POST /boards ─────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { name, description, visibility = 'public', tags = '' } = req.body
  const userId = req.user.id

  if (!name) return res.status(400).json({ error: 'Name required' })

  try {
    const boardId = generateUUID()
    await query(
      `INSERT INTO boards (id, owner_id, name, description, visibility, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [boardId, userId, name, description || null, visibility]
    )

    // Insertar tags
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
    for (const tag of tagList) {
      await query('INSERT IGNORE INTO board_tags (board_id, tag) VALUES (?, ?)', [boardId, tag])
    }

    res.json({ success: true, boardId })
  } catch (err) {
    console.error('[Boards/Create]', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── PUT /boards/:id ──────────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const { name, description, visibility, tags = '' } = req.body
  const userId = req.user.id

  try {
    const board = await queryOne('SELECT id FROM boards WHERE id = ? AND owner_id = ?', [id, userId])
    if (!board) return res.status(404).json({ error: 'Not found' })

    await query(
      `UPDATE boards SET name = ?, description = ?, visibility = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, description || null, visibility, id]
    )

    // Actualizar tags: borrar y re-insertar
    await query('DELETE FROM board_tags WHERE board_id = ?', [id])
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
    for (const tag of tagList) {
      await query('INSERT IGNORE INTO board_tags (board_id, tag) VALUES (?, ?)', [id, tag])
    }

    res.json({ success: true })
  } catch (err) {
    console.error('[Boards/Update]', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── DELETE /boards/:id ───────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const board = await queryOne('SELECT id FROM boards WHERE id = ? AND owner_id = ?', [id, userId])
    if (!board) return res.status(404).json({ error: 'Not found' })

    await query('DELETE FROM boards WHERE id = ?', [id])
    res.json({ success: true })
  } catch (err) {
    console.error('[Boards/Delete]', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── GET /boards/:id ─────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const board = await queryOne(
      `SELECT b.*, GROUP_CONCAT(bt.tag SEPARATOR ',') AS tags_raw
       FROM boards b
       LEFT JOIN board_tags bt ON bt.board_id = b.id
       WHERE b.id = ? AND (b.owner_id = ? OR b.visibility = 'public')
       GROUP BY b.id`,
      [id, userId]
    )
    if (!board) return res.status(404).send('Board not found')
    board.tags = board.tags_raw ? board.tags_raw.split(',') : []

    const items = await query(
      `SELECT o.id, o.name, o.slug, o.price, o.preview_storage_ids, o.short_description,
              u.username AS creator_username, bi.added_at, bi.note
       FROM board_items bi
       JOIN overlays o ON o.id = bi.overlay_id
       JOIN users u ON u.id = o.creator_id
       WHERE bi.board_id = ?
       ORDER BY bi.added_at DESC`,
      [id]
    )

    res.render('board_detail', {
      title: `${board.name} | SimplyOver`,
      board,
      items,
    })
  } catch (err) {
    console.error('[Boards/Detail]', err)
    res.status(500).send('Error loading board')
  }
})

// ─── GET /api/list ───────────────────────────────────────────────────────────
router.get('/api/list', requireAuth, async (req, res) => {
  try {
    const boards = await query(
      `SELECT b.id, b.name, b.visibility, COUNT(bi.overlay_id) AS item_count
       FROM boards b
       LEFT JOIN board_items bi ON bi.board_id = b.id
       WHERE b.owner_id = ?
       GROUP BY b.id
       ORDER BY b.updated_at DESC`,
      [req.user.id]
    )
    res.json({ boards })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── POST /api/add-item ───────────────────────────────────────────────────────
router.post('/api/add-item', requireAuth, async (req, res) => {
  const { boardId, overlayId } = req.body
  const userId = req.user.id

  if (!boardId || !overlayId) return res.status(400).json({ error: 'Missing fields' })

  try {
    const board = await queryOne('SELECT id FROM boards WHERE id = ? AND owner_id = ?', [boardId, userId])
    if (!board) return res.status(404).json({ error: 'Board not found' })

    await query(
      'INSERT IGNORE INTO board_items (board_id, overlay_id, added_at) VALUES (?, ?, NOW())',
      [boardId, overlayId]
    )
    
    // Update board updated_at
    await query('UPDATE boards SET updated_at = NOW() WHERE id = ?', [boardId])

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── DELETE /boards/:id/items/:overlayId ─────────────────────────────────────
router.delete('/:id/items/:overlayId', requireAuth, async (req, res) => {
  const { id, overlayId } = req.params
  const userId = req.user.id

  try {
    const board = await queryOne('SELECT id FROM boards WHERE id = ? AND owner_id = ?', [id, userId])
    if (!board) return res.status(404).json({ error: 'Board not found or not owner' })

    await query('DELETE FROM board_items WHERE board_id = ? AND overlay_id = ?', [id, overlayId])
    await query('UPDATE boards SET updated_at = NOW() WHERE id = ?', [id])

    res.json({ success: true })
  } catch (err) {
    console.error('[Boards/RemoveItem]', err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
