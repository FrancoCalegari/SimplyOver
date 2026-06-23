/**
 * GET  /api/boards  — Lista tableros del usuario autenticado
 * POST /api/boards  — Crea un nuevo tablero
 *
 * GET Query: includePrivate (bool, default false para terceros)
 * POST Body: { name, description?, visibility? }
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import {
  ok, created, badRequest, serverError, sanitize,
} from '@/lib/apiResponse.js'

/** GET /api/boards */
export async function GET(request) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    // Solo el propio usuario puede ver sus tableros privados
    const includePrivate = searchParams.get('userId') === session.id ||
                           !searchParams.has('userId')

    const targetUserId = searchParams.get('userId') ?? session.id

    const boards = await spiderWeb.getUserBoards(targetUserId, { includePrivate })
    return ok(boards)
  } catch (err) {
    return serverError(err)
  }
}

/** POST /api/boards */
export async function POST(request) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const body = await request.json()
    const { name, description, visibility = 'public' } = body ?? {}

    if (!name || name.trim().length < 2) {
      return badRequest('El nombre del tablero debe tener al menos 2 caracteres.')
    }
    if (name.length > 150) {
      return badRequest('El nombre del tablero no puede superar 150 caracteres.')
    }
    if (!['public', 'private'].includes(visibility)) {
      return badRequest('La visibilidad debe ser "public" o "private".')
    }

    const board = await spiderWeb.createBoard({
      ownerId:     session.id,
      name:        sanitize(name),
      description: description ? sanitize(description) : null,
      visibility,
    })

    return created({ board })
  } catch (err) {
    return serverError(err)
  }
}
