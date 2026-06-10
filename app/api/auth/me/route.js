/**
 * GET  /api/auth/me   — Devuelve la sesión actual
 * POST /api/auth/me   — (unused, placeholder)
 * DELETE /api/auth/logout — Borra la cookie de sesión
 */

import { requireAuth, buildLogoutCookie } from '@/lib/auth.js'
import { ok, serverError } from '@/lib/apiResponse.js'
import { spiderWeb } from '@/lib/SpiderWebService.js'

/** GET /api/auth/me */
export async function GET(request) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    // Obtener datos frescos del perfil
    const user = await spiderWeb.queryOne(
      `SELECT id, username, email, display_name, avatar_storage_id,
              role, status, artist_tags, created_at
       FROM users WHERE id = '${session.id}' LIMIT 1`
    )

    return ok({ user })
  } catch (err) {
    return serverError(err)
  }
}

/** DELETE /api/auth/logout */
export async function DELETE(request) {
  try {
    const { error } = await requireAuth(request)
    if (error) return error

    const response = ok({ message: 'Sesión cerrada correctamente.' })
    response.headers.set('Set-Cookie', buildLogoutCookie())
    return response
  } catch (err) {
    return serverError(err)
  }
}
