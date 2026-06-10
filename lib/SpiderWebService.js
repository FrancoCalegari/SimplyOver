/**
 * ============================================================
 * SpiderWebService.js
 * Servicio centralizado de integración con la infraestructura
 * SpiderWeb API para SimplyOver.
 *
 * Cubre:
 *   - SQL Database (POST /query)
 *   - Cloud Storage (POST /storage/projects/18/files · GET /storage/files/:id)
 *   - SpiderIA (GET /ia/models · POST /ia/chat)
 *   - Entidades de dominio: Favoritos, Tableros, Overlays, Usuarios
 *
 * Uso (Node.js ESM / Next.js Server-Side):
 *   import { spiderWeb } from '@/lib/SpiderWebService.js'
 *   const rows = await spiderWeb.query('SELECT * FROM overlays LIMIT 10')
 * ============================================================
 *
 * Variables de entorno requeridas (.env.local):
 *   SPIDERWEBURL            → URL base de la API
 *   SPIDERWEBAPIKEY         → Clave de autenticación (header X-API-KEY)
 *   SPIDERWEBDB             → Nombre de la base de datos
 *   SPIDERWEBCLOUDSTORAGEID → ID de proyecto de almacenamiento
 */

// ── Helpers de configuración ───────────────────────────────

const BASE_URL    = process.env.SPIDERWEBURL            ?? 'http://190.220.229.45:7256/api/v1'
const API_KEY     = process.env.SPIDERWEBAPIKEY         ?? ''
const DB_NAME     = process.env.SPIDERWEBDB             ?? ''
const STORAGE_ID  = process.env.SPIDERWEBCLOUDSTORAGEID ?? '18'

/** Headers JSON comunes (sin Content-Type para FormData) */
const jsonHeaders = () => ({
  'Content-Type': 'application/json',
  'X-API-KEY':    API_KEY,
})

/** Headers solo con API-KEY (para FormData — el browser/node agrega el boundary) */
const authHeaders = () => ({
  'X-API-KEY': API_KEY,
})

/**
 * Wrapper seguro de fetch con manejo de errores HTTP.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<any>} JSON parseado
 */
async function apiFetch(url, options = {}) {
  const response = await fetch(url, options)

  if (!response.ok) {
    let message = `SpiderWeb API error ${response.status}`
    try {
      const body = await response.json()
      message += `: ${body?.message ?? JSON.stringify(body)}`
    } catch {
      message += `: ${await response.text()}`
    }
    throw new Error(message)
  }

  // Algunas rutas devuelven 204 sin body
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}


// ══════════════════════════════════════════════════════════════
// Clase principal
// ══════════════════════════════════════════════════════════════

class SpiderWebService {

  // ──────────────────────────────────────────────────────────
  // A. PERSISTENCIA SQL
  // ──────────────────────────────────────────────────────────

  /**
   * Ejecuta una query SQL cruda en la base de datos configurada.
   * @param {string} sql      - Consulta SQL (puede incluir parámetros literales)
   * @returns {Promise<any[]>} - Array de filas resultado
   *
   * @example
   * const rows = await spiderWeb.query(`SELECT * FROM overlays WHERE status = 'APPROVED'`)
   */
  async query(sql) {
    const data = await apiFetch(`${BASE_URL}/query`, {
      method:  'POST',
      headers: jsonHeaders(),
      body:    JSON.stringify({ database: DB_NAME, query: sql }),
    })
    // La API devuelve { data: [...] } o directamente el array
    return data?.data ?? data ?? []
  }

  /**
   * Ejecuta una query y devuelve la primera fila (o null).
   * @param {string} sql
   * @returns {Promise<object|null>}
   */
  async queryOne(sql) {
    const rows = await this.query(sql)
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
  }


  // ──────────────────────────────────────────────────────────
  // B. ALMACENAMIENTO (Cloud Storage — Proyecto 18)
  // ──────────────────────────────────────────────────────────

  /**
   * Sube uno o varios archivos al proyecto de storage configurado.
   * @param {File|Blob|Buffer} fileOrFiles - Un archivo o array de archivos
   * @param {string[]} [fileNames]         - Nombres opcionales (solo para Buffer)
   * @returns {Promise<{ id: string, url: string }[]>} - Lista de archivos subidos con sus IDs
   *
   * @example
   * // En un Route Handler de Next.js:
   * const [uploaded] = await spiderWeb.uploadFiles(formData.get('zip'))
   * // uploaded.id → '123' (guardar en DB)
   */
  async uploadFiles(fileOrFiles, fileNames = []) {
    const formData = new FormData()
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles]

    files.forEach((file, index) => {
      if (file instanceof Blob || file instanceof File) {
        formData.append('files', file, file.name ?? fileNames[index] ?? `file_${index}`)
      } else if (Buffer.isBuffer(file)) {
        // Node.js: convertir Buffer a Blob
        const blob = new Blob([file])
        formData.append('files', blob, fileNames[index] ?? `file_${index}`)
      } else {
        throw new TypeError(`Unsupported file type at index ${index}`)
      }
    })

    const data = await apiFetch(
      `${BASE_URL}/storage/projects/${STORAGE_ID}/files`,
      { method: 'POST', headers: authHeaders(), body: formData }
    )

    return data?.files ?? data ?? []
  }

  /**
   * Devuelve la URL pública de descarga de un archivo por su ID.
   * @param {string} fileId - ID devuelto al subir el archivo
   * @returns {string} URL de descarga directa
   */
  getFileUrl(fileId) {
    return `${BASE_URL}/storage/files/${fileId}`
  }

  /**
   * Descarga el contenido de un archivo como ArrayBuffer.
   * Útil para servir archivos desde un Route Handler (evita exposición directa).
   * @param {string} fileId
   * @returns {Promise<ArrayBuffer>}
   */
  async downloadFile(fileId) {
    const response = await fetch(this.getFileUrl(fileId), {
      headers: authHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Error descargando archivo ${fileId}: HTTP ${response.status}`)
    }
    return response.arrayBuffer()
  }


  // ──────────────────────────────────────────────────────────
  // C. INTELIGENCIA ARTIFICIAL (SpiderIA)
  // ──────────────────────────────────────────────────────────

  /**
   * Lista los modelos de IA disponibles.
   * @returns {Promise<{ id: string, name: string, [key: string]: any }[]>}
   */
  async getIAModels() {
    return apiFetch(`${BASE_URL}/ia/models`, {
      method:  'GET',
      headers: jsonHeaders(),
    })
  }

  /**
   * Envía un mensaje a un modelo de IA (chat completion).
   * @param {string} modelId  - ID del modelo (obtenido con getIAModels)
   * @param {{ role: 'user'|'assistant'|'system', content: string }[]} messages
   * @returns {Promise<{ role: string, content: string }>} - Respuesta del modelo
   *
   * @example
   * const reply = await spiderWeb.iaChat('model-abc123', [
   *   { role: 'user', content: 'Dame ideas para un overlay estilo cyberpunk' }
   * ])
   */
  async iaChat(modelId, messages) {
    const data = await apiFetch(`${BASE_URL}/ia/chat`, {
      method:  'POST',
      headers: jsonHeaders(),
      body:    JSON.stringify({ model_id: modelId, messages }),
    })
    return data?.message ?? data
  }


  // ══════════════════════════════════════════════════════════
  // ENTIDADES DE DOMINIO — MÉTODOS DE ALTO NIVEL
  // ══════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────
  // D. USUARIOS
  // ──────────────────────────────────────────────────────────

  /**
   * Busca un usuario por email (para login).
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async getUserByEmail(email) {
    const safeEmail = email.replace(/'/g, "''")
    return this.queryOne(
      `SELECT id, username, email, password_hash, role, status, avatar_storage_id
       FROM users
       WHERE email = '${safeEmail}' AND status = 'active'
       LIMIT 1`
    )
  }

  /**
   * Obtiene el perfil público completo de un usuario por username.
   * @param {string} username
   * @returns {Promise<object|null>}
   */
  async getUserProfile(username) {
    const safe = username.replace(/'/g, "''")
    return this.queryOne(
      `SELECT id, username, display_name, bio, avatar_storage_id, banner_storage_id,
              link_instagram, link_pinterest, link_twitch, link_kick,
              link_tiktok, link_web, link_email, artist_tags,
              role, created_at
       FROM users
       WHERE username = '${safe}'
       LIMIT 1`
    )
  }

  /**
   * Crea un nuevo usuario. La contraseña debe llegar ya hasheada (bcrypt).
   * @param {{ username, email, passwordHash, displayName? }} params
   * @returns {Promise<{ id: string }>}
   */
  async createUser({ username, email, passwordHash, displayName = null }) {
    const safe = (s) => (s ?? '').replace(/'/g, "''")
    const displayVal = displayName ? `'${safe(displayName)}'` : 'NULL'

    return this.queryOne(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ('${safe(username)}', '${safe(email)}', '${safe(passwordHash)}', ${displayVal})
       RETURNING id, username, email, role, created_at`
    )
  }

  /**
   * Actualiza los campos de perfil de un usuario.
   * @param {string} userId
   * @param {Partial<{ bio, displayName, avatarStorageId, bannerStorageId,
   *                   linkInstagram, linkPinterest, linkTwitch, linkKick,
   *                   linkTiktok, linkWeb, linkEmail, artistTags }>} fields
   */
  async updateUserProfile(userId, fields) {
    const sets = []
    const map = {
      displayName:      'display_name',
      bio:              'bio',
      avatarStorageId:  'avatar_storage_id',
      bannerStorageId:  'banner_storage_id',
      linkInstagram:    'link_instagram',
      linkPinterest:    'link_pinterest',
      linkTwitch:       'link_twitch',
      linkKick:         'link_kick',
      linkTiktok:       'link_tiktok',
      linkWeb:          'link_web',
      linkEmail:        'link_email',
    }

    for (const [jsKey, sqlCol] of Object.entries(map)) {
      if (fields[jsKey] !== undefined) {
        const val = (fields[jsKey] ?? '').replace(/'/g, "''")
        sets.push(`${sqlCol} = '${val}'`)
      }
    }

    if (fields.artistTags !== undefined && Array.isArray(fields.artistTags)) {
      const tagsLiteral = fields.artistTags
        .map((t) => `"${t.replace(/"/g, '\\"')}"`)
        .join(',')
      sets.push(`artist_tags = '{${tagsLiteral}}'`)
    }

    if (sets.length === 0) return null

    return this.queryOne(
      `UPDATE users SET ${sets.join(', ')}
       WHERE id = '${userId}'
       RETURNING id, username, display_name, updated_at`
    )
  }

  /**
   * Historial de compras de un usuario (JOIN con overlay y creador).
   * @param {string} userId
   * @returns {Promise<any[]>}
   */
  async getPurchaseHistory(userId) {
    return this.query(
      `SELECT * FROM purchase_history
       WHERE buyer_id = '${userId}'
       ORDER BY purchased_at DESC`
    )
  }


  // ──────────────────────────────────────────────────────────
  // E. OVERLAYS — CATÁLOGO
  // ──────────────────────────────────────────────────────────

  /**
   * Overlays aprobados con paginación (Discovery / Landing).
   * @param {{ page?, limit?, categorySlug?, minRating?, onlyFree? }} opts
   * @returns {Promise<any[]>}
   */
  async getApprovedOverlays({ page = 1, limit = 24, categorySlug, minRating, onlyFree } = {}) {
    const offset = (page - 1) * limit
    let where = `o.status = 'APPROVED'`
    const joins = []

    if (categorySlug) {
      const safe = categorySlug.replace(/'/g, "''")
      joins.push(`JOIN overlay_categories oc ON oc.overlay_id = o.id
                  JOIN categories c ON c.id = oc.category_id AND c.slug = '${safe}'`)
    }

    if (onlyFree) where += ` AND o.price = 0`

    return this.query(
      `SELECT r.*
       FROM overlay_ratings r
       JOIN overlays o ON o.id = r.id
       ${joins.join('\n')}
       WHERE ${where}
         ${minRating ? `AND r.avg_rating >= ${Number(minRating)}` : ''}
       ORDER BY r.avg_rating DESC NULLS LAST, r.favorite_count DESC
       LIMIT ${limit} OFFSET ${offset}`
    )
  }

  /**
   * Overlays destacados (is_featured = true).
   * @param {number} [limit=8]
   */
  async getFeaturedOverlays(limit = 8) {
    return this.query(
      `SELECT r.*
       FROM overlay_ratings r
       JOIN overlays o ON o.id = r.id
       WHERE o.status = 'APPROVED' AND o.is_featured = TRUE
       ORDER BY r.avg_rating DESC NULLS LAST
       LIMIT ${limit}`
    )
  }

  /**
   * Motor de búsqueda avanzada (trigram + tags + creador).
   * @param {string} term - Texto libre a buscar
   * @param {{ page?, limit? }} opts
   * @returns {Promise<any[]>}
   */
  async searchOverlays(term, { page = 1, limit = 24 } = {}) {
    const safe   = term.replace(/'/g, "''")
    const offset = (page - 1) * limit

    return this.query(
      `SELECT DISTINCT r.*,
              similarity(o.name, '${safe}') AS name_sim
       FROM overlay_ratings r
       JOIN overlays o ON o.id = r.id
       LEFT JOIN users u ON u.id = o.creator_id
       WHERE o.status = 'APPROVED'
         AND (
           o.name        ILIKE '%${safe}%'
           OR o.description ILIKE '%${safe}%'
           OR EXISTS (
             SELECT 1 FROM unnest(o.tags) t WHERE t ILIKE '%${safe}%'
           )
           OR u.username ILIKE '%${safe}%'
           OR u.display_name ILIKE '%${safe}%'
         )
       ORDER BY name_sim DESC, r.avg_rating DESC NULLS LAST
       LIMIT ${limit} OFFSET ${offset}`
    )
  }

  /**
   * Detalle completo de un overlay por slug.
   * @param {string} slug
   */
  async getOverlayBySlug(slug) {
    const safe = slug.replace(/'/g, "''")
    return this.queryOne(
      `SELECT r.*,
              u.username AS creator_username,
              u.display_name AS creator_display_name,
              u.avatar_storage_id AS creator_avatar
       FROM overlay_ratings r
       JOIN overlays o ON o.id = r.id
       JOIN users u ON u.id = o.creator_id
       WHERE o.slug = '${safe}' AND o.status = 'APPROVED'`
    )
  }

  /**
   * Incrementa el contador de vistas de un overlay.
   * @param {string} overlayId UUID
   */
  async incrementOverlayViews(overlayId) {
    return this.query(
      `UPDATE overlays SET view_count = view_count + 1 WHERE id = '${overlayId}'`
    )
  }


  // ──────────────────────────────────────────────────────────
  // F. FAVORITOS (LIKES)
  // ──────────────────────────────────────────────────────────

  /**
   * Agrega un overlay a los favoritos del usuario.
   * Ignora duplicados silenciosamente (ON CONFLICT DO NOTHING).
   * @param {string} userId
   * @param {string} overlayId
   */
  async addFavorite(userId, overlayId) {
    return this.query(
      `INSERT INTO favorites (user_id, overlay_id)
       VALUES ('${userId}', '${overlayId}')
       ON CONFLICT DO NOTHING`
    )
  }

  /**
   * Elimina un overlay de los favoritos del usuario.
   * @param {string} userId
   * @param {string} overlayId
   */
  async removeFavorite(userId, overlayId) {
    return this.query(
      `DELETE FROM favorites
       WHERE user_id = '${userId}' AND overlay_id = '${overlayId}'`
    )
  }

  /**
   * Verifica si un usuario ya dio like a un overlay.
   * @param {string} userId
   * @param {string} overlayId
   * @returns {Promise<boolean>}
   */
  async isFavorited(userId, overlayId) {
    const row = await this.queryOne(
      `SELECT 1 FROM favorites
       WHERE user_id = '${userId}' AND overlay_id = '${overlayId}'
       LIMIT 1`
    )
    return row !== null
  }

  /**
   * Lista todos los overlays que un usuario ha marcado como favorito.
   * @param {string} userId
   * @param {{ page?, limit? }} opts
   */
  async getUserFavorites(userId, { page = 1, limit = 24 } = {}) {
    const offset = (page - 1) * limit
    return this.query(
      `SELECT r.*, f.created_at AS favorited_at
       FROM favorites f
       JOIN overlay_ratings r ON r.id = f.overlay_id
       WHERE f.user_id = '${userId}'
       ORDER BY f.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    )
  }


  // ──────────────────────────────────────────────────────────
  // G. TABLEROS (BOARDS — Sistema tipo Pinterest)
  // ──────────────────────────────────────────────────────────

  /**
   * Crea un nuevo tablero.
   * @param {{ ownerId, name, description?, visibility? }} params
   * @returns {Promise<object>} - Tablero creado
   */
  async createBoard({ ownerId, name, description = null, visibility = 'public' }) {
    const safeName = name.replace(/'/g, "''")
    const safeDesc = description ? `'${description.replace(/'/g, "''")}'` : 'NULL'

    return this.queryOne(
      `INSERT INTO boards (owner_id, name, description, visibility)
       VALUES ('${ownerId}', '${safeName}', ${safeDesc}, '${visibility}')
       RETURNING id, name, description, visibility, created_at`
    )
  }

  /**
   * Lista los tableros de un usuario.
   * @param {string} userId
   * @param {{ includePrivate? }} opts - includePrivate solo para el propio dueño
   */
  async getUserBoards(userId, { includePrivate = false } = {}) {
    const visFilter = includePrivate
      ? ''
      : `AND b.visibility = 'public'`

    return this.query(
      `SELECT b.*, COUNT(bi.overlay_id) AS item_count
       FROM boards b
       LEFT JOIN board_items bi ON bi.board_id = b.id
       WHERE b.owner_id = '${userId}' ${visFilter}
       GROUP BY b.id
       ORDER BY b.created_at DESC`
    )
  }

  /**
   * Obtiene el detalle de un tablero y sus overlays.
   * @param {string} boardId UUID del tablero
   * @param {string} requestingUserId UUID del usuario que solicita (para validar privacidad)
   */
  async getBoardWithItems(boardId, requestingUserId = null) {
    // Datos del tablero
    const board = await this.queryOne(
      `SELECT * FROM board_details WHERE id = '${boardId}'`
    )
    if (!board) return null

    // Verificar privacidad
    if (board.visibility === 'private' && board.owner_id !== requestingUserId) {
      return null  // acceso denegado — manejar en el controlador
    }

    // Items del tablero
    const items = await this.query(
      `SELECT r.*, bi.note, bi.added_at
       FROM board_items bi
       JOIN overlay_ratings r ON r.id = bi.overlay_id
       WHERE bi.board_id = '${boardId}'
       ORDER BY bi.added_at DESC`
    )

    return { ...board, items }
  }

  /**
   * Guarda un overlay en un tablero (ON CONFLICT DO NOTHING).
   * @param {string} boardId
   * @param {string} overlayId
   * @param {string} [note]
   */
  async saveToBoard(boardId, overlayId, note = null) {
    const safeNote = note ? `'${note.replace(/'/g, "''")}'` : 'NULL'
    return this.query(
      `INSERT INTO board_items (board_id, overlay_id, note)
       VALUES ('${boardId}', '${overlayId}', ${safeNote})
       ON CONFLICT DO NOTHING`
    )
  }

  /**
   * Elimina un overlay de un tablero.
   * @param {string} boardId
   * @param {string} overlayId
   */
  async removeFromBoard(boardId, overlayId) {
    return this.query(
      `DELETE FROM board_items
       WHERE board_id = '${boardId}' AND overlay_id = '${overlayId}'`
    )
  }

  /**
   * Actualiza los metadatos de un tablero.
   * @param {string} boardId
   * @param {{ name?, description?, visibility?, coverStorageId? }} fields
   */
  async updateBoard(boardId, fields) {
    const sets = []
    if (fields.name)            sets.push(`name = '${fields.name.replace(/'/g, "''")}'`)
    if (fields.description)     sets.push(`description = '${fields.description.replace(/'/g, "''")}'`)
    if (fields.visibility)      sets.push(`visibility = '${fields.visibility}'`)
    if (fields.coverStorageId)  sets.push(`cover_storage_id = '${fields.coverStorageId}'`)

    if (sets.length === 0) return null

    return this.queryOne(
      `UPDATE boards SET ${sets.join(', ')}
       WHERE id = '${boardId}'
       RETURNING id, name, visibility, updated_at`
    )
  }

  /**
   * Elimina un tablero y todos sus items (CASCADE en DB).
   * @param {string} boardId
   * @param {string} ownerId - Verificación de propiedad en capa de servicio
   */
  async deleteBoard(boardId, ownerId) {
    return this.query(
      `DELETE FROM boards
       WHERE id = '${boardId}' AND owner_id = '${ownerId}'`
    )
  }


  // ──────────────────────────────────────────────────────────
  // H. RESEÑAS
  // ──────────────────────────────────────────────────────────

  /**
   * Lista las reviews de un overlay con datos del autor.
   * @param {string} overlayId
   */
  async getOverlayReviews(overlayId) {
    return this.query(
      `SELECT r.id, r.rating, r.title, r.body, r.created_at,
              u.username, u.display_name, u.avatar_storage_id
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.overlay_id = '${overlayId}'
       ORDER BY r.created_at DESC`
    )
  }

  /**
   * Crea una review (solo si el usuario compró el overlay).
   * @param {{ overlayId, userId, purchaseId, rating, title?, body? }} params
   */
  async createReview({ overlayId, userId, purchaseId, rating, title = null, body = null }) {
    const safeTitle = title ? `'${title.replace(/'/g, "''")}'` : 'NULL'
    const safeBody  = body  ? `'${body.replace(/'/g, "''")}'`  : 'NULL'

    return this.queryOne(
      `INSERT INTO reviews (overlay_id, user_id, purchase_id, rating, title, body)
       VALUES ('${overlayId}', '${userId}', '${purchaseId}', ${rating}, ${safeTitle}, ${safeBody})
       ON CONFLICT (overlay_id, user_id) DO UPDATE
         SET rating = EXCLUDED.rating, title = EXCLUDED.title,
             body = EXCLUDED.body, updated_at = NOW()
       RETURNING id, rating, created_at`
    )
  }


  // ──────────────────────────────────────────────────────────
  // I. COMPRAS (PURCHASES)
  // ──────────────────────────────────────────────────────────

  /**
   * Registra una nueva compra pendiente al iniciar el checkout.
   * @param {{ buyerId, overlayId, creatorId, amountPaid, currency?, mpPreferenceId? }} params
   * @returns {Promise<{ id: string, download_token: string }>}
   */
  async createPurchase({ buyerId, overlayId, creatorId, amountPaid, currency = 'ARS', mpPreferenceId = null }) {
    // Generar download token: UUID + timestamp ofuscado
    const token       = `so_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    const prefVal     = mpPreferenceId ? `'${mpPreferenceId}'` : 'NULL'
    const now         = new Date().toISOString().replace('T', ' ').slice(0, 23)  // YYYY-MM-DD HH:mm:ss.SSS

    return this.queryOne(
      `INSERT INTO purchases
         (buyer_id, overlay_id, creator_id, amount_paid, currency, mp_preference_id, download_token, created_at)
       VALUES
         ('${buyerId}', '${overlayId}', '${creatorId}', ${amountPaid}, '${currency}', ${prefVal}, '${token}', '${now}')
       RETURNING id, download_token, status, created_at`
    )
  }

  /**
   * Confirma una compra al recibir el webhook de Mercado Pago.
   * @param {{ mpPaymentId, mpStatus, purchaseId }} params
   */
  async confirmPurchase({ mpPaymentId, mpStatus, purchaseId }) {
    const now     = new Date().toISOString().replace('T', ' ').slice(0, 23)
    const status  = mpStatus === 'approved' ? 'COMPLETED' : 'FAILED'
    const compVal = status === 'COMPLETED' ? `'${now}'` : 'NULL'

    return this.queryOne(
      `UPDATE purchases
       SET mp_payment_id = '${mpPaymentId}',
           mp_status     = '${mpStatus}',
           status        = '${status}',
           completed_at  = ${compVal},
           updated_at    = '${now}'
       WHERE id = '${purchaseId}'
       RETURNING id, status, download_token, completed_at`
    )
  }

  /**
   * Obtiene una compra por su download_token (para validar acceso de descarga).
   * @param {string} token
   */
  async getPurchaseByToken(token) {
    return this.queryOne(
      `SELECT p.*, o.zip_storage_id, o.name AS overlay_name
       FROM purchases p
       JOIN overlays o ON o.id = p.overlay_id
       WHERE p.download_token = '${token}'
         AND p.status = 'COMPLETED'
         AND p.download_count < p.download_limit
       LIMIT 1`
    )
  }

  /**
   * Registra una descarga (incrementa contador).
   * @param {string} purchaseId
   */
  async recordDownload(purchaseId) {
    return this.query(
      `UPDATE purchases
       SET download_count = download_count + 1
       WHERE id = '${purchaseId}'`
    )
  }


  // ──────────────────────────────────────────────────────────
  // J. ADMIN — MODERACIÓN
  // ──────────────────────────────────────────────────────────

  /**
   * Aprueba o banea un overlay (moderación).
   * @param {string} overlayId
   * @param {'APPROVED'|'BANNED'} newStatus
   * @param {string} adminId - Para el log de auditoría
   * @param {string} [reason]
   */
  async moderateOverlay(overlayId, newStatus, adminId, reason = null) {
    const now      = new Date().toISOString().replace('T', ' ').slice(0, 23)
    const pubDate  = newStatus === 'APPROVED' ? `'${now}'` : 'NULL'
    const safeReason = reason ? reason.replace(/'/g, "''") : ''

    await this.query(
      `UPDATE overlays
       SET status = '${newStatus}', published_at = ${pubDate}
       WHERE id = '${overlayId}'`
    )

    // Registrar en audit log
    return this.query(
      `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id, detail)
       VALUES ('${adminId}', '${newStatus}_OVERLAY', 'overlay', '${overlayId}',
               '{"reason":"${safeReason}"}')`
    )
  }

  /**
   * Suspende o activa una cuenta de usuario.
   * @param {string} targetUserId
   * @param {'active'|'suspended'|'banned'} newStatus
   * @param {string} adminId
   */
  async moderateUser(targetUserId, newStatus, adminId) {
    await this.query(
      `UPDATE users SET status = '${newStatus}' WHERE id = '${targetUserId}'`
    )

    return this.query(
      `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id)
       VALUES ('${adminId}', 'SET_USER_STATUS_${newStatus.toUpperCase()}', 'user', '${targetUserId}')`
    )
  }

  /**
   * Overlays pendientes de moderación.
   * @param {{ page?, limit? }} opts
   */
  async getPendingOverlays({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit
    return this.query(
      `SELECT o.*, u.username AS creator_username
       FROM overlays o
       JOIN users u ON u.id = o.creator_id
       WHERE o.status = 'PENDING'
       ORDER BY o.created_at ASC
       LIMIT ${limit} OFFSET ${offset}`
    )
  }

  /**
   * Obtiene el log de auditoría con datos del admin.
   * @param {{ page?, limit?, entityType? }} opts
   */
  async getAuditLog({ page = 1, limit = 50, entityType } = {}) {
    const offset     = (page - 1) * limit
    const typeFilter = entityType ? `AND al.entity_type = '${entityType}'` : ''

    return this.query(
      `SELECT al.*, u.username AS admin_username
       FROM admin_audit_log al
       JOIN users u ON u.id = al.admin_id
       WHERE 1=1 ${typeFilter}
       ORDER BY al.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    )
  }
}


// ──────────────────────────────────────────────────────────
// Exportación — singleton para uso en toda la app Next.js
// ──────────────────────────────────────────────────────────

/** @type {SpiderWebService} */
export const spiderWeb = new SpiderWebService()

export default SpiderWebService
