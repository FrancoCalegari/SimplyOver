/**
 * GET /api/admin/users
 * Lista todos los usuarios con paginación y búsqueda.
 * Solo admins.
 *
 * Query: page, limit, search (username/email), role, status
 */

import { spiderWeb }    from '@/lib/SpiderWebService.js'
import { requireAdmin } from '@/lib/auth.js'
import {
  ok, serverError, sanitize, parsePagination,
} from '@/lib/apiResponse.js'

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit }  = parsePagination(searchParams)
    const offset           = (page - 1) * limit

    const search = searchParams.get('search')?.trim()
    const role   = searchParams.get('role')
    const status = searchParams.get('status')

    const conditions = ['1=1']

    if (search && search.length >= 2) {
      const safe = sanitize(search)
      conditions.push(`(username ILIKE '%${safe}%' OR email ILIKE '%${safe}%')`)
    }
    if (['user', 'creator', 'admin'].includes(role)) {
      conditions.push(`role = '${role}'`)
    }
    if (['active', 'suspended', 'banned'].includes(status)) {
      conditions.push(`status = '${status}'`)
    }

    const where = conditions.join(' AND ')

    const users = await spiderWeb.query(
      `SELECT id, username, email, display_name, role, status,
              avatar_storage_id, created_at
       FROM users
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    )

    const totalRow = await spiderWeb.queryOne(
      `SELECT COUNT(*) AS total FROM users WHERE ${where}`
    )

    return ok(users, {
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
