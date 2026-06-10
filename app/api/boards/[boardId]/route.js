/**
 * GET    /api/boards/[boardId]  — Detalle del tablero con sus overlays
 * PATCH  /api/boards/[boardId]  — Actualizar nombre/descripción/visibilidad/cover
 * DELETE /api/boards/[boardId]  — Eliminar tablero
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import {
  ok, badRequest, forbidden, notFound, serverError,
  sanitize, isValidUUID,
} from '@/lib/apiResponse.js'

/** GET /api/boards/[boardId] */
export async function GET(request, { params }) {
  try {
    const { boardId } = params
    if (!isValidUUID(boardId)) return badRequest('boardId inválido.')

    const { session } = await requireAuth(request).catch(() => ({ session: null }))
    const data = await spiderWeb.getBoardWithItems(boardId, session?.id ?? null)

    if (data === null) return notFound('Tablero')
    return ok(data)
  } catch (err) {
    return serverError(err)
  }
}

/** PATCH /api/boards/[boardId] */
export async function PATCH(request, { params }) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const { boardId } = params
    if (!isValidUUID(boardId)) return badRequest('boardId inválido.')

    // Verificar propiedad
    const board = await spiderWeb.queryOne(
      `SELECT id, owner_id FROM boards WHERE id = '${boardId}' LIMIT 1`
    )
    if (!board)               return notFound('Tablero')
    if (board.owner_id !== session.id && session.role !== 'admin') {
      return forbidden('No tenés permisos para editar este tablero.')
    }

    const body = await request.json()
    const fields = {}

    if (body.name !== undefined) {
      if (body.name.trim().length < 2) return badRequest('El nombre es demasiado corto.')
      fields.name = sanitize(body.name)
    }
    if (body.description !== undefined) fields.description  = sanitize(body.description)
    if (body.visibility  !== undefined) {
      if (!['public', 'private'].includes(body.visibility)) {
        return badRequest('Visibilidad inválida.')
      }
      fields.visibility = body.visibility
    }
    if (body.coverStorageId !== undefined) fields.coverStorageId = sanitize(body.coverStorageId)

    if (Object.keys(fields).length === 0) return badRequest('No hay campos para actualizar.')

    const updated = await spiderWeb.updateBoard(boardId, fields)
    return ok({ board: updated })
  } catch (err) {
    return serverError(err)
  }
}

/** DELETE /api/boards/[boardId] */
export async function DELETE(request, { params }) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const { boardId } = params
    if (!isValidUUID(boardId)) return badRequest('boardId inválido.')

    const board = await spiderWeb.queryOne(
      `SELECT id, owner_id FROM boards WHERE id = '${boardId}' LIMIT 1`
    )
    if (!board)               return notFound('Tablero')
    if (board.owner_id !== session.id && session.role !== 'admin') {
      return forbidden('No tenés permisos para eliminar este tablero.')
    }

    await spiderWeb.deleteBoard(boardId, board.owner_id)
    return ok({ message: 'Tablero eliminado correctamente.' })
  } catch (err) {
    return serverError(err)
  }
}
