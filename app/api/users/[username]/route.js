/**
 * GET   /api/users/[username]   — Perfil público de un usuario
 * PATCH /api/users/[username]   — (no aplica aquí, usar /api/users/me)
 */

import { spiderWeb }  from '@/lib/SpiderWebService.js'
import { getSession } from '@/lib/auth.js'
import { ok, notFound, serverError, sanitize } from '@/lib/apiResponse.js'

/** GET /api/users/[username] */
export async function GET(request, { params }) {
  try {
    const username = sanitize(params.username)
    const profile  = await spiderWeb.getUserProfile(username)
    if (!profile) return notFound('Usuario')

    // Enriquecer con stats públicas
    const [overlayCount, followerCount] = await Promise.all([
      spiderWeb.queryOne(
        `SELECT COUNT(*) AS count FROM overlays
         WHERE creator_id = '${profile.id}' AND status = 'APPROVED'`
      ),
      spiderWeb.queryOne(
        `SELECT COUNT(*) AS count FROM favorites f
         JOIN overlays o ON o.id = f.overlay_id
         WHERE o.creator_id = '${profile.id}'`
      ),
    ])

    return ok({
      ...profile,
      stats: {
        overlay_count:   parseInt(overlayCount?.count ?? 0),
        total_favorites: parseInt(followerCount?.count ?? 0),
      },
    })
  } catch (err) {
    return serverError(err)
  }
}
