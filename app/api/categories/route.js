/**
 * GET  /api/categories
 * Lista todas las categorías disponibles del marketplace.
 * Pública, sin autenticación.
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { ok, serverError } from '@/lib/apiResponse.js'

export async function GET() {
  try {
    const categories = await spiderWeb.query(
      `SELECT c.id, c.slug, c.name, c.description, c.icon,
              COUNT(oc.overlay_id) AS overlay_count
       FROM categories c
       LEFT JOIN overlay_categories oc ON oc.category_id = c.id
       LEFT JOIN overlays o ON o.id = oc.overlay_id AND o.status = 'APPROVED'
       GROUP BY c.id
       ORDER BY c.name ASC`
    )
    return ok(categories)
  } catch (err) {
    return serverError(err)
  }
}
