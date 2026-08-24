/**
 * routes/messages.js
 * Sistema de mensajería directa entre usuarios.
 */

import { Router } from 'express'
import { query, queryOne, generateUUID } from '../lib/db.js'
import { requireAuth } from '../lib/authExpress.js'

const router = Router()

// ─── GET /messages ────────────────────────────────────────────────────────────
// Muestra el inbox con las últimas conversaciones
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id

  try {
    // Obtener conversaciones únicas (último mensaje de cada hilo)
    const conversations = await query(
      `SELECT
         CASE WHEN dm.sender_id = ? THEN dm.receiver_id ELSE dm.sender_id END AS partner_id,
         u.username AS partner_username, u.display_name AS partner_display_name,
         u.avatar_storage_id AS partner_avatar,
         MAX(dm.created_at) AS last_message_at,
         (SELECT content FROM direct_messages dm2
          WHERE (dm2.sender_id = ? AND dm2.receiver_id = partner_id)
             OR (dm2.receiver_id = ? AND dm2.sender_id = partner_id)
          ORDER BY dm2.created_at DESC LIMIT 1) AS last_message,
         SUM(CASE WHEN dm.receiver_id = ? AND dm.read_at IS NULL THEN 1 ELSE 0 END) AS unread_count
       FROM direct_messages dm
       JOIN users u ON u.id = CASE WHEN dm.sender_id = ? THEN dm.receiver_id ELSE dm.sender_id END
       WHERE dm.sender_id = ? OR dm.receiver_id = ?
       GROUP BY partner_id, u.username, u.display_name, u.avatar_storage_id
       ORDER BY last_message_at DESC`,
      [userId, userId, userId, userId, userId, userId, userId]
    )

    res.render('messages', {
      title: 'Messages | SimplyOver',
      conversations,
      activeConversation: null,
      messages: [],
    })
  } catch (err) {
    console.error('[Messages]', err)
    res.render('messages', {
      title: 'Messages | SimplyOver',
      conversations: [],
      activeConversation: null,
      messages: [],
    })
  }
})

// ─── GET /messages/:username ──────────────────────────────────────────────────
// Muestra la conversación con un usuario específico
router.get('/:username', requireAuth, async (req, res) => {
  const userId = req.user.id
  const { username } = req.params

  try {
    const partner = await queryOne(
      'SELECT id, username, display_name, avatar_storage_id, bio FROM users WHERE username = ?',
      [username]
    )
    if (!partner) return res.status(404).redirect('/messages')

    // Marcar mensajes como leídos
    await query(
      'UPDATE direct_messages SET read_at = NOW() WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL',
      [partner.id, userId]
    )

    const messages = await query(
      `SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.created_at, dm.read_at,
              u.username AS sender_username
       FROM direct_messages dm
       JOIN users u ON u.id = dm.sender_id
       WHERE (dm.sender_id = ? AND dm.receiver_id = ?)
          OR (dm.sender_id = ? AND dm.receiver_id = ?)
       ORDER BY dm.created_at ASC
       LIMIT 100`,
      [userId, partner.id, partner.id, userId]
    )

    const conversations = await query(
      `SELECT
         CASE WHEN dm.sender_id = ? THEN dm.receiver_id ELSE dm.sender_id END AS partner_id,
         u.username AS partner_username, u.display_name AS partner_display_name,
         u.avatar_storage_id AS partner_avatar,
         MAX(dm.created_at) AS last_message_at,
         SUM(CASE WHEN dm.receiver_id = ? AND dm.read_at IS NULL THEN 1 ELSE 0 END) AS unread_count
       FROM direct_messages dm
       JOIN users u ON u.id = CASE WHEN dm.sender_id = ? THEN dm.receiver_id ELSE dm.sender_id END
       WHERE dm.sender_id = ? OR dm.receiver_id = ?
       GROUP BY partner_id, u.username, u.display_name, u.avatar_storage_id
       ORDER BY last_message_at DESC`,
      [userId, userId, userId, userId, userId]
    )

    res.render('messages', {
      title: `Chat with @${partner.username} | SimplyOver`,
      conversations,
      activeConversation: partner,
      messages,
    })
  } catch (err) {
    console.error('[Messages/Chat]', err)
    res.redirect('/messages')
  }
})

// ─── POST /messages/send ──────────────────────────────────────────────────────
router.post('/send', requireAuth, async (req, res) => {
  const { receiverUsername, content } = req.body
  const senderId = req.user.id

  if (!receiverUsername || !content?.trim()) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  try {
    const receiver = await queryOne(
      'SELECT id FROM users WHERE username = ?',
      [receiverUsername]
    )
    if (!receiver) return res.status(404).json({ error: 'User not found' })
    if (receiver.id === senderId) return res.status(400).json({ error: 'Cannot message yourself' })

    const msgId = generateUUID()
    await query(
      `INSERT INTO direct_messages (id, sender_id, receiver_id, content, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [msgId, senderId, receiver.id, content.trim()]
    )

    res.json({ success: true, messageId: msgId })
  } catch (err) {
    console.error('[Messages/Send]', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── GET /api/messages/:username/poll ─────────────────────────────────────────
// Long-poll para nuevos mensajes (usado por el frontend)
router.get('/api/poll/:username', requireAuth, async (req, res) => {
  const userId = req.user.id
  const { username } = req.params
  const { since } = req.query

  try {
    const partner = await queryOne('SELECT id FROM users WHERE username = ?', [username])
    if (!partner) return res.json({ messages: [] })

    let sql = `
      SELECT dm.id, dm.sender_id, dm.content, dm.created_at,
             u.username AS sender_username
      FROM direct_messages dm
      JOIN users u ON u.id = dm.sender_id
      WHERE ((dm.sender_id = ? AND dm.receiver_id = ?)
          OR (dm.sender_id = ? AND dm.receiver_id = ?))
    `
    const params = [userId, partner.id, partner.id, userId]

    if (since) {
      sql += ' AND dm.created_at > ?'
      params.push(since)
    }
    sql += ' ORDER BY dm.created_at ASC LIMIT 50'

    const messages = await query(sql, params)
    res.json({ messages })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
