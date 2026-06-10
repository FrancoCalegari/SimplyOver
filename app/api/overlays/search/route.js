/**
 * GET /api/overlays/search
 * Motor de búsqueda por nombre, descripción, tags y artista.
 *
 * Query params:
 *   q       (string, obligatorio)
 *   page    (number, default 1)
 *   limit   (number, default 24)
 */

import { spiderWeb }  from '@/lib/SpiderWebService.js'
import { ok, badRequest, serverError, sanitize, parsePagination } from '@/lib/apiResponse.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return badRequest('El parámetro "q" debe tener al menos 2 caracteres.')
    }
    if (q.length > 100) {
      return badRequest('La búsqueda no puede superar 100 caracteres.')
    }

    const { page, limit } = parsePagination(searchParams)
    const results = await spiderWeb.searchOverlays(sanitize(q), { page, limit })

    return ok(results, {
      meta: { query: q, page, limit, count: results.length },
    })
  } catch (err) {
    return serverError(err)
  }
}
