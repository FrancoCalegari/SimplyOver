/**
 * DELETE /api/boards/[boardId]/items/[overlayId]
 * Quita un overlay de un tablero.
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import {
  ok, badRequest, forbidden, notFound, serverError, isValidUUID,
} from '@/lib/apiResponse.js'

export async function DELETE(request, { params }) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const { boardId, overlayId } = params
    if (!isValidUUID(boardId))   return badRequest('boardId inválido.')
    if (!isValidUUID(overlayId)) return badRequest('overlayId inválido.')

    const board = await spiderWeb.queryOne(
      `SELECT id, owner_id FROM boards WHERE id = '${boardId}' LIMIT 1`
    )
    if (!board)               return notFound('Tablero')
    if (board.owner_id !== session.id) {
      return forbidden('Solo el dueño del tablero puede eliminar overlays.')
    }

    await spiderWeb.removeFromBoard(boardId, overlayId)
    return ok({ message: 'Overlay quitado del tablero.', boardId, overlayId })
  } catch (err) {
    return serverError(err)
  }
}
