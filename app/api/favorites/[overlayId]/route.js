/**
 * GET    /api/favorites/[overlayId]  — Estado de favorito para un overlay
 * DELETE /api/favorites/[overlayId]  — Elimina un overlay de favoritos
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import {
  ok, badRequest, serverError, isValidUUID,
} from '@/lib/apiResponse.js'

/** GET /api/favorites/[overlayId] — ¿Está este overlay en mis favoritos? */
export async function GET(request, { params }) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const { overlayId } = params
    if (!isValidUUID(overlayId)) return badRequest('overlayId inválido.')

    const favorited   = await spiderWeb.isFavorited(session.id, overlayId)
    const countRow    = await spiderWeb.queryOne(
      `SELECT COUNT(*) AS count FROM favorites WHERE overlay_id = '${overlayId}'`
    )

    return ok({
      overlayId,
      favorited,
      favoriteCount: parseInt(countRow?.count ?? 0),
    })
  } catch (err) {
    return serverError(err)
  }
}

/** DELETE /api/favorites/[overlayId] */
export async function DELETE(request, { params }) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const { overlayId } = params
    if (!isValidUUID(overlayId)) return badRequest('overlayId inválido.')

    await spiderWeb.removeFavorite(session.id, overlayId)

    const countRow = await spiderWeb.queryOne(
      `SELECT COUNT(*) AS count FROM favorites WHERE overlay_id = '${overlayId}'`
    )

    return ok({
      favorited:     false,
      overlayId,
      favoriteCount: parseInt(countRow?.count ?? 0),
    })
  } catch (err) {
    return serverError(err)
  }
}
