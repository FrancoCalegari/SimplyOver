/**
 * GET  /api/users/me/purchases
 * Historial de compras del usuario autenticado.
 *
 * Query: page, limit
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import { ok, serverError, parsePagination } from '@/lib/apiResponse.js'

export async function GET(request) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit }  = parsePagination(searchParams)
    const offset           = (page - 1) * limit

    const purchases = await spiderWeb.query(
      `SELECT * FROM purchase_history
       WHERE buyer_id = '${session.id}'
       ORDER BY purchased_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    )

    const totalRow = await spiderWeb.queryOne(
      `SELECT COUNT(*) AS total FROM purchases WHERE buyer_id = '${session.id}'`
    )

    return ok(purchases, {
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
