/**
 * PATCH /api/admin/overlays/[id]/moderate
 * Aprueba o banea un overlay.
 *
 * Body: { action: 'APPROVED' | 'BANNED', reason? }
 */

import { spiderWeb }    from '@/lib/SpiderWebService.js'
import { requireAdmin } from '@/lib/auth.js'
import {
  ok, badRequest, notFound, serverError, sanitize, isValidUUID,
} from '@/lib/apiResponse.js'

export async function PATCH(request, { params }) {
  try {
    const { session, error } = await requireAdmin(request)
    if (error) return error

    const { id } = params
    if (!isValidUUID(id)) return badRequest('ID de overlay inválido.')

    const overlay = await spiderWeb.queryOne(
      `SELECT id, name, status FROM overlays WHERE id = '${id}' LIMIT 1`
    )
    if (!overlay) return notFound('Overlay')

    const body   = await request.json()
    const action = body?.action
    const reason = body?.reason ?? null

    if (!['APPROVED', 'BANNED'].includes(action)) {
      return badRequest('La acción debe ser "APPROVED" o "BANNED".')
    }

    await spiderWeb.moderateOverlay(id, action, session.id, reason ? sanitize(reason) : null)

    return ok({
      message: `Overlay "${overlay.name}" ${action === 'APPROVED' ? 'aprobado' : 'baneado'} correctamente.`,
      overlayId: id,
      newStatus: action,
    })
  } catch (err) {
    return serverError(err)
  }
}
