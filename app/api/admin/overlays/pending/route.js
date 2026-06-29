/**
 * GET /api/admin/overlays/pending
 * Lista los overlays en estado PENDING para moderación.
 * Solo admins.
 *
 * Query: page, limit
 */

import { spiderWeb }    from '@/lib/SpiderWebService.js'
import { requireAdmin } from '@/lib/auth.js'
import { ok, serverError, parsePagination } from '@/lib/apiResponse.js'

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit }  = parsePagination(searchParams)

    const overlays = await spiderWeb.getPendingOverlays({ page, limit })

    const totalRow = await spiderWeb.queryOne(
      `SELECT COUNT(*) AS total FROM overlays WHERE status = 'PENDING'`
    )

    return ok(overlays, {
      meta: {
        page,
        limit,
        total:      parseInt(totalRow?.total ?? 0),
        totalPages: Math.ceil(parseInt(totalRow?.total ?? 0) / limit),
      },
    })
  } catch (err) {
    return serverError(err)
  }
}
