/**
 * POST   /api/boards/[boardId]/items              — Guardar overlay en tablero
 * DELETE /api/boards/[boardId]/items/[overlayId]  — Quitar overlay del tablero
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import {
  ok, badRequest, forbidden, notFound, serverError,
  sanitize, isValidUUID,
} from '@/lib/apiResponse.js'

/** POST /api/boards/[boardId]/items */
export async function POST(request, { params }) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const { boardId } = params
    if (!isValidUUID(boardId)) return badRequest('boardId inválido.')

    const body      = await request.json()
    const overlayId = body?.overlayId
    const note      = body?.note ?? null

    if (!overlayId || !isValidUUID(overlayId)) {
      return badRequest('overlayId es obligatorio y debe ser un UUID válido.')
    }

    // Verificar propiedad del tablero
    const board = await spiderWeb.queryOne(
      `SELECT id, owner_id FROM boards WHERE id = '${boardId}' LIMIT 1`
    )
    if (!board)               return notFound('Tablero')
    if (board.owner_id !== session.id) {
      return forbidden('Solo el dueño del tablero puede agregar overlays.')
    }

    // Verificar que el overlay existe y está aprobado
    const overlay = await spiderWeb.queryOne(
      `SELECT id FROM overlays WHERE id = '${overlayId}' AND status = 'APPROVED' LIMIT 1`
    )
    if (!overlay) return notFound('Overlay')

    await spiderWeb.saveToBoard(boardId, overlayId, note ? sanitize(note) : null)

    return ok({
      message:   'Overlay guardado en el tablero.',
      boardId,
      overlayId,
    })
  } catch (err) {
    return serverError(err)
  }
}
