/**
 * routes/profile.js
 * Gestión del perfil del usuario autenticado:
 *   - GET  /profile/settings     → página de configuración
 *   - POST /profile/update       → actualizar bio, display_name, redes sociales
 *   - POST /profile/avatar       → subir foto de perfil (avatar)
 *   - POST /profile/banner       → subir banner de perfil
 *   - POST /profile/follow/:id   → seguir a un usuario
 *   - DELETE /profile/follow/:id → dejar de seguir
 *   - GET  /profile/follow-status/:id → estado de seguimiento
 */

import { Router }    from 'express'
import { query, queryOne, generateUUID } from '../lib/db.js'
import { requireAuth, signToken, setAuthCookie } from '../lib/authExpress.js'
import { spiderWeb }   from '../lib/SpiderWebService.js'

const router = Router()

// ─── GET /profile/settings ────────────────────────────────────────────────────
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const user = await queryOne(
      `SELECT id, username, email, display_name, bio,
              avatar_storage_id, banner_storage_id,
              link_instagram, link_pinterest, link_twitch,
              link_kick, link_tiktok, link_web, link_email,
              artist_tags, role, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [req.user.id]
    )

    // Contadores de follows
    const followersRow = await queryOne(
      'SELECT COUNT(*) AS cnt FROM user_follows WHERE following_id = ?',
      [req.user.id]
    )
    const followingRow = await queryOne(
      'SELECT COUNT(*) AS cnt FROM user_follows WHERE follower_id = ?',
      [req.user.id]
    )

    res.render('profile_settings', {
      title: 'Profile Settings | SimplyOver',
      profileUser: user,
      followers: followersRow?.cnt || 0,
      following: followingRow?.cnt || 0,
      spiderwebUrl: process.env.SPIDERWEBURL || '',
    })
  } catch (err) {
    console.error('[Profile/Settings]', err)
    res.render('profile_settings', {
      title: 'Profile Settings | SimplyOver',
      profileUser: req.user,
      followers: 0,
      following: 0,
      spiderwebUrl: process.env.SPIDERWEBURL || '',
    })
  }
})

// ─── POST /profile/update ─────────────────────────────────────────────────────
router.post('/update', requireAuth, async (req, res) => {
  const { display_name, bio, link_instagram, link_twitch, link_kick,
          link_tiktok, link_web, link_email, link_pinterest, artist_tags } = req.body

  console.log('[Profile/Update] Received body:', req.body)

  try {
    const sets = []
    const params = []

    if (display_name !== undefined) { sets.push('display_name = ?'); params.push(display_name || null) }
    if (bio          !== undefined) { sets.push('bio = ?');          params.push(bio || null) }
    if (link_instagram !== undefined) { sets.push('link_instagram = ?'); params.push(link_instagram || null) }
    if (link_twitch    !== undefined) { sets.push('link_twitch = ?');    params.push(link_twitch || null) }
    if (link_kick      !== undefined) { sets.push('link_kick = ?');      params.push(link_kick || null) }
    if (link_tiktok    !== undefined) { sets.push('link_tiktok = ?');    params.push(link_tiktok || null) }
    if (link_web       !== undefined) { sets.push('link_web = ?');       params.push(link_web || null) }
    if (link_email     !== undefined) { sets.push('link_email = ?');     params.push(link_email || null) }
    if (link_pinterest !== undefined) { sets.push('link_pinterest = ?'); params.push(link_pinterest || null) }
    if (artist_tags    !== undefined) {
      const tagsArr = artist_tags.split(',').map(t => t.trim()).filter(Boolean)
      sets.push('artist_tags = ?')
      params.push(JSON.stringify(tagsArr))
    }

    sets.push('updated_at = NOW()')

    if (sets.length > 1) {
      params.push(req.user.id)
      await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params)

      // Actualizar JWT para reflejar los cambios en el navbar
      const updatedUser = await queryOne(
        'SELECT id, username, email, role, display_name, avatar_storage_id FROM users WHERE id = ? LIMIT 1',
        [req.user.id]
      )
      if (updatedUser) {
        const token = await signToken(updatedUser)
        setAuthCookie(res, token)
      }
    }

    res.json({ success: true, message: 'Profile updated successfully' })
  } catch (err) {
    console.error('[Profile/Update]', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── POST /profile/avatar ─────────────────────────────────────────────────────
router.post('/avatar', requireAuth, async (req, res) => {
  try {
    if (!req.headers['content-type']?.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Multipart form required' })
    }

    // Leer el body como buffer para FormData
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const rawBuffer = Buffer.concat(chunks)

    // Extraer el archivo del multipart (forma simplificada con spiderWeb.uploadFiles)
    // Usamos el método de SpiderWeb directamente con FormData nativo de Node
    const boundary = req.headers['content-type'].split('boundary=')[1]
    if (!boundary) return res.status(400).json({ error: 'No boundary in multipart' })

    // Parsear el archivo del buffer multipart
    const delimiter = Buffer.from(`--${boundary}`)
    const parts = []
    let start = rawBuffer.indexOf(delimiter) + delimiter.length + 2 // skip \r\n
    while (start < rawBuffer.length) {
      const end = rawBuffer.indexOf(delimiter, start)
      if (end === -1) break
      parts.push(rawBuffer.slice(start, end - 2)) // remove trailing \r\n
      start = end + delimiter.length + 2
    }

    if (parts.length === 0) return res.status(400).json({ error: 'No file in request' })

    const part = parts[0]
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
    const headers = part.slice(0, headerEnd).toString()
    const fileData = part.slice(headerEnd + 4)

    // Extraer filename y content-type del header
    const filenameMatch = headers.match(/filename="([^"]+)"/)
    const ctMatch = headers.match(/Content-Type:\s*([^\r\n]+)/)
    const filename = filenameMatch ? filenameMatch[1] : 'avatar.jpg'
    const mimeType = ctMatch ? ctMatch[1].trim() : 'image/jpeg'

    // Subir a SpiderWeb Storage
    const blob = new Blob([fileData], { type: mimeType })
    const file = new File([blob], filename, { type: mimeType })
    const [uploaded] = await spiderWeb.uploadFiles(file)

    if (!uploaded?.id) return res.status(500).json({ error: 'Upload failed' })

    // Actualizar en DB
    await query('UPDATE users SET avatar_storage_id = ?, updated_at = NOW() WHERE id = ?',
      [uploaded.id, req.user.id])

    // Actualizar JWT
    const updatedUser = await queryOne(
      'SELECT id, username, email, role, display_name, avatar_storage_id FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    )
    if (updatedUser) {
      const token = await signToken(updatedUser)
      setAuthCookie(res, token)
    }

    res.json({
      success: true,
      avatarId: uploaded.id,
      avatarUrl: `${process.env.SPIDERWEBURL}/storage/files/${uploaded.id}`
    })
  } catch (err) {
    console.error('[Profile/Avatar]', err)
    res.status(500).json({ error: 'Server error: ' + err.message })
  }
})

// ─── POST /profile/banner ─────────────────────────────────────────────────────
router.post('/banner', requireAuth, async (req, res) => {
  try {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const rawBuffer = Buffer.concat(chunks)

    const boundary = req.headers['content-type']?.split('boundary=')[1]
    if (!boundary) return res.status(400).json({ error: 'No boundary' })

    const delimiter = Buffer.from(`--${boundary}`)
    let start = rawBuffer.indexOf(delimiter) + delimiter.length + 2
    const end = rawBuffer.indexOf(delimiter, start)
    const part = rawBuffer.slice(start, end - 2)
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
    const headers = part.slice(0, headerEnd).toString()
    const fileData = part.slice(headerEnd + 4)

    const filenameMatch = headers.match(/filename="([^"]+)"/)
    const ctMatch = headers.match(/Content-Type:\s*([^\r\n]+)/)
    const filename = filenameMatch ? filenameMatch[1] : 'banner.jpg'
    const mimeType = ctMatch ? ctMatch[1].trim() : 'image/jpeg'

    const blob = new Blob([fileData], { type: mimeType })
    const file = new File([blob], filename, { type: mimeType })
    const [uploaded] = await spiderWeb.uploadFiles(file)

    if (!uploaded?.id) return res.status(500).json({ error: 'Upload failed' })

    await query('UPDATE users SET banner_storage_id = ?, updated_at = NOW() WHERE id = ?',
      [uploaded.id, req.user.id])

    res.json({
      success: true,
      bannerId: uploaded.id,
      bannerUrl: `${process.env.SPIDERWEBURL}/storage/files/${uploaded.id}`
    })
  } catch (err) {
    console.error('[Profile/Banner]', err)
    res.status(500).json({ error: 'Server error: ' + err.message })
  }
})

// ─── POST /profile/follow/:id ─────────────────────────────────────────────────
router.post('/follow/:id', requireAuth, async (req, res) => {
  const followingId = req.params.id
  const followerId  = req.user.id

  if (followerId === followingId) {
    return res.status(400).json({ error: 'Cannot follow yourself' })
  }

  try {
    // Verificar que el usuario a seguir existe
    const target = await queryOne('SELECT id FROM users WHERE id = ? AND status = "active"', [followingId])
    if (!target) return res.status(404).json({ error: 'User not found' })

    // INSERT IGNORE para idempotencia
    await query(
      'INSERT IGNORE INTO user_follows (follower_id, following_id, created_at) VALUES (?, ?, NOW())',
      [followerId, followingId]
    )

    const countRow = await queryOne(
      'SELECT COUNT(*) AS cnt FROM user_follows WHERE following_id = ?',
      [followingId]
    )

    res.json({ success: true, following: true, followers: countRow?.cnt || 0 })
  } catch (err) {
    console.error('[Profile/Follow]', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── DELETE /profile/follow/:id ───────────────────────────────────────────────
router.delete('/follow/:id', requireAuth, async (req, res) => {
  const followingId = req.params.id
  const followerId  = req.user.id

  try {
    await query(
      'DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    )

    const countRow = await queryOne(
      'SELECT COUNT(*) AS cnt FROM user_follows WHERE following_id = ?',
      [followingId]
    )

    res.json({ success: true, following: false, followers: countRow?.cnt || 0 })
  } catch (err) {
    console.error('[Profile/Unfollow]', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── GET /profile/follow-status/:id ──────────────────────────────────────────
router.get('/follow-status/:id', requireAuth, async (req, res) => {
  const followingId = req.params.id
  const followerId  = req.user.id

  try {
    const row = await queryOne(
      'SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ? LIMIT 1',
      [followerId, followingId]
    )
    const countRow = await queryOne(
      'SELECT COUNT(*) AS cnt FROM user_follows WHERE following_id = ?',
      [followingId]
    )
    res.json({ following: row !== null, followers: countRow?.cnt || 0 })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
