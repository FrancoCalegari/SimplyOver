/**
 * PATCH /api/admin/users/[id]/moderate
 * Cambia el estado de una cuenta de usuario.
 *
 * Body: { status: 'active' | 'suspended' | 'banned' }
 */

import { spiderWeb }    from '@/lib/SpiderWebService.js'
import { requireAdmin } from '@/lib/auth.js'
import {
  ok, badRequest, notFound, forbidden, serverError, isValidUUID,
} from '@/lib/apiResponse.js'

export async function PATCH(request, { params }) {
  try {
    const { session, error } = await requireAdmin(request)
    if (error) return error

    const { id } = params
    if (!isValidUUID(id)) return badRequest('ID de usuario inválido.')

    // No puede auto-suspenderse
    if (id === session.id) return forbidden('No podés modificar tu propio estado.')

    const user = await spiderWeb.queryOne(
      `SELECT id, username, status, role FROM users WHERE id = '${id}' LIMIT 1`
    )
    if (!user) return notFound('Usuario')

    const body      = await request.json()
    const newStatus = body?.status

    if (!['active', 'suspended', 'banned'].includes(newStatus)) {
      return badRequest('El estado debe ser "active", "suspended" o "banned".')
    }

    await spiderWeb.moderateUser(id, newStatus, session.id)

    return ok({
      message:   `Usuario "${user.username}" actualizado a estado "${newStatus}".`,
      userId:    id,
      newStatus,
    })
  } catch (err) {
    return serverError(err)
  }
}
