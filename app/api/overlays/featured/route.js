/**
 * GET /api/overlays/featured
 * Overlays destacados (is_featured = true), ordenados por rating.
 *
 * Query params: limit (1-20, default 8)
 */

import { spiderWeb }  from '@/lib/SpiderWebService.js'
import { ok, serverError } from '@/lib/apiResponse.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '8', 10)))

    const overlays = await spiderWeb.getFeaturedOverlays(limit)
    return ok(overlays)
  } catch (err) {
    return serverError(err)
  }
}
