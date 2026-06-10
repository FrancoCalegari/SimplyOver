/**
 * GET /api/admin/audit-log
 * Historial de acciones administrativas con filtros.
 *
 * Query: page, limit, entityType (overlay | user | purchase)
 */

import { spiderWeb }    from '@/lib/SpiderWebService.js'
import { requireAdmin } from '@/lib/auth.js'
import { ok, serverError, sanitize, parsePagination } from '@/lib/apiResponse.js'

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit }  = parsePagination(searchParams)
    const entityType       = searchParams.get('entityType') ?? null

    const validTypes = ['overlay', 'user', 'purchase']
    const safeType   = entityType && validTypes.includes(entityType)
      ? entityType
      : null

    const log = await spiderWeb.getAuditLog({
      page,
      limit,
      entityType: safeType,
    })

    return ok(log, { meta: { page, limit, count: log.length } })
  } catch (err) {
    return serverError(err)
  }
}
