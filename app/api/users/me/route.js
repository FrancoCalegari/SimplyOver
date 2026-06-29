/**
 * GET   /api/users/me           — Perfil privado del usuario autenticado
 * PATCH /api/users/me           — Actualizar perfil (bio, links, tags, etc.)
 */

import { spiderWeb }    from '@/lib/SpiderWebService.js'
import { requireAuth }  from '@/lib/auth.js'
import {
  ok, badRequest, serverError, sanitize,
} from '@/lib/apiResponse.js'

const ALLOWED_PATCH_FIELDS = [
  'displayName', 'bio', 'linkInstagram', 'linkPinterest',
  'linkTwitch', 'linkKick', 'linkTiktok', 'linkWeb', 'linkEmail',
  'artistTags',
]

/** GET /api/users/me */
export async function GET(request) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const user = await spiderWeb.queryOne(
      `SELECT id, username, email, display_name, bio,
              avatar_storage_id, banner_storage_id,
              link_instagram, link_pinterest, link_twitch, link_kick,
              link_tiktok, link_web, link_email, artist_tags,
              role, status, created_at
       FROM users WHERE id = '${session.id}' LIMIT 1`
    )

    return ok({ user })
  } catch (err) {
    return serverError(err)
  }
}

/** PATCH /api/users/me */
export async function PATCH(request) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const body   = await request.json()
    const fields = {}

    for (const key of ALLOWED_PATCH_FIELDS) {
      if (body[key] !== undefined) {
        if (key === 'artistTags') {
          if (!Array.isArray(body[key])) return badRequest('artistTags debe ser un array.')
          fields.artistTags = body[key].map((t) => sanitize(String(t))).slice(0, 10)
        } else if (key === 'bio') {
          if (body[key].length > 500) return badRequest('La bio no puede superar 500 caracteres.')
          fields.bio = sanitize(body[key])
        } else {
          fields[key] = sanitize(String(body[key]))
        }
      }
    }

    if (Object.keys(fields).length === 0) {
      return badRequest('No se proporcionaron campos para actualizar.')
    }

    const updated = await spiderWeb.updateUserProfile(session.id, fields)
    return ok({ user: updated })
  } catch (err) {
    return serverError(err)
  }
}
