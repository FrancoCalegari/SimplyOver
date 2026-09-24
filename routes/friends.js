/**
 * routes/friends.js
 * Sistema de amistades entre usuarios.
 * POST   /api/friends/request        — enviar solicitud
 * POST   /api/friends/accept/:id     — aceptar
 * POST   /api/friends/decline/:id    — rechazar/cancelar
 * DELETE /api/friends/:id            — eliminar amistad
 * GET    /api/friends                — listar amigos aceptados
 * GET    /api/friends/pending        — solicitudes pendientes entrantes
 * GET    /api/friends/status/:userId — estado de amistad con un usuario
 */

import { Router } from 'express';
import { query, queryOne, generateUUID } from '../lib/db.js';
import { requireAuth } from '../lib/authExpress.js';

const router = Router();

// ─── POST /api/friends/request ───────────────────────────────────────────────
router.post('/request', requireAuth, async (req, res) => {
  const { userId } = req.body;
  const requesterId = req.user.id;

  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (userId === requesterId) return res.status(400).json({ error: 'Cannot add yourself' });

  try {
    const target = await queryOne('SELECT id FROM users WHERE id = ? AND status = "active"', [userId]);
    if (!target) return res.status(404).json({ error: 'User not found' });

    // Verificar si ya existe una solicitud/amistad
    const existing = await queryOne(
      `SELECT id, status FROM friendships 
       WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
      [requesterId, userId, userId, requesterId]
    );

    if (existing) {
      if (existing.status === 'ACCEPTED') return res.status(400).json({ error: 'Already friends' });
      if (existing.status === 'PENDING') return res.status(400).json({ error: 'Request already sent' });
      // Si fue declinado, permitir reenviar actualizando
      await query(
        'UPDATE friendships SET status = "PENDING", requester_id = ?, addressee_id = ?, updated_at = NOW() WHERE id = ?',
        [requesterId, userId, existing.id]
      );
      return res.json({ success: true, action: 'resent' });
    }

    const id = generateUUID();
    await query(
      `INSERT INTO friendships (id, requester_id, addressee_id, status, created_at, updated_at)
       VALUES (?, ?, ?, 'PENDING', NOW(), NOW())`,
      [id, requesterId, userId]
    );

    res.json({ success: true, action: 'sent' });
  } catch (err) {
    console.error('[Friends/Request]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/friends/accept/:id ────────────────────────────────────────────
router.post('/accept/:id', requireAuth, async (req, res) => {
  const friendshipId = req.params.id;
  const userId = req.user.id;

  try {
    const friendship = await queryOne(
      'SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = "PENDING"',
      [friendshipId, userId]
    );
    if (!friendship) return res.status(404).json({ error: 'Request not found' });

    await query(
      'UPDATE friendships SET status = "ACCEPTED", updated_at = NOW() WHERE id = ?',
      [friendshipId]
    );

    res.json({ success: true, action: 'accepted' });
  } catch (err) {
    console.error('[Friends/Accept]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/friends/decline/:id ───────────────────────────────────────────
router.post('/decline/:id', requireAuth, async (req, res) => {
  const friendshipId = req.params.id;
  const userId = req.user.id;

  try {
    const friendship = await queryOne(
      'SELECT * FROM friendships WHERE id = ? AND (addressee_id = ? OR requester_id = ?)',
      [friendshipId, userId, userId]
    );
    if (!friendship) return res.status(404).json({ error: 'Request not found' });

    await query(
      'UPDATE friendships SET status = "DECLINED", updated_at = NOW() WHERE id = ?',
      [friendshipId]
    );

    res.json({ success: true, action: 'declined' });
  } catch (err) {
    console.error('[Friends/Decline]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /api/friends/:id ─────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  const friendshipId = req.params.id;
  const userId = req.user.id;

  try {
    const friendship = await queryOne(
      'SELECT * FROM friendships WHERE id = ? AND (requester_id = ? OR addressee_id = ?)',
      [friendshipId, userId, userId]
    );
    if (!friendship) return res.status(404).json({ error: 'Friendship not found' });

    await query('DELETE FROM friendships WHERE id = ?', [friendshipId]);
    res.json({ success: true, action: 'removed' });
  } catch (err) {
    console.error('[Friends/Delete]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/friends ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const friends = await query(
      `SELECT f.id AS friendship_id,
              CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END AS friend_id,
              u.username, u.display_name, u.avatar_storage_id, f.created_at AS friends_since
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
       WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status = 'ACCEPTED'
       ORDER BY f.updated_at DESC`,
      [userId, userId, userId, userId]
    );
    res.json({ friends });
  } catch (err) {
    console.error('[Friends/List]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/friends/pending ─────────────────────────────────────────────────
router.get('/pending', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const requests = await query(
      `SELECT f.id AS friendship_id, f.requester_id,
              u.username, u.display_name, u.avatar_storage_id, f.created_at
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
       WHERE f.addressee_id = ? AND f.status = 'PENDING'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json({ requests });
  } catch (err) {
    console.error('[Friends/Pending]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/friends/status/:userId ─────────────────────────────────────────
router.get('/status/:userId', requireAuth, async (req, res) => {
  const targetUserId = req.params.userId;
  const myId = req.user.id;

  try {
    const friendship = await queryOne(
      `SELECT id, status, requester_id, addressee_id FROM friendships
       WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
      [myId, targetUserId, targetUserId, myId]
    );

    if (!friendship) return res.json({ status: 'none', friendshipId: null });

    const isRequester = friendship.requester_id === myId;
    res.json({
      status: friendship.status,
      friendshipId: friendship.id,
      isRequester,
    });
  } catch (err) {
    console.error('[Friends/Status]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
