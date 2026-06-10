/**
 * GET    /api/favorites             — Lista overlays favoritos del usuario
 * POST   /api/favorites             — Agrega un overlay a favoritos
 *
 * POST Body: { overlayId }
 * GET  Query: page, limit
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import {
  ok, badRequest, serverError, sanitize,
  isValidUUID, parsePagination,
} from '@/lib/apiResponse.js'

/** GET /api/favorites */
export async function GET(request) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit }  = parsePagination(searchParams)

    const favorites = await spiderWeb.getUserFavorites(session.id, { page, limit })
    return ok(favorites, { meta: { page, limit, count: favorites.length } })
  } catch (err) {
    return serverError(err)
  }
}

/** POST /api/favorites */
export async function POST(request) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const body      = await request.json()
    const overlayId = body?.overlayId

    if (!overlayId || !isValidUUID(overlayId)) {
      return badRequest('overlayId es obligatorio y debe ser un UUID válido.')
    }

    // Verificar que el overlay existe y está aprobado
    const overlay = await spiderWeb.queryOne(
      `SELECT id FROM overlays WHERE id = '${overlayId}' AND status = 'APPROVED' LIMIT 1`
    )
    if (!overlay) return badRequest('Overlay no encontrado o no disponible.')

    await spiderWeb.addFavorite(session.id, overlayId)

    // Obtener conteo actualizado
    const countRow = await spiderWeb.queryOne(
      `SELECT COUNT(*) AS count FROM favorites WHERE overlay_id = '${overlayId}'`
    )

    return ok({
      favorited:     true,
      overlayId,
      favoriteCount: parseInt(countRow?.count ?? 0),
    })
  } catch (err) {
    return serverError(err)
  }
}
