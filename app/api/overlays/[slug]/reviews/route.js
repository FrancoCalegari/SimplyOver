/**
 * GET  /api/overlays/[slug]/reviews  — Lista reseñas de un overlay
 * POST /api/overlays/[slug]/reviews  — Crea/actualiza una reseña (requiere compra)
 *
 * POST Body: { purchaseId, rating (1-10), title?, body? }
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import {
  ok, created, badRequest, forbidden, notFound, serverError,
  sanitize, isValidUUID,
} from '@/lib/apiResponse.js'

/** GET /api/overlays/[slug]/reviews */
export async function GET(request, { params }) {
  try {
    const slug    = sanitize(params.slug)
    const overlay = await spiderWeb.queryOne(
      `SELECT id FROM overlays WHERE slug = '${slug}' AND status = 'APPROVED' LIMIT 1`
    )
    if (!overlay) return notFound('Overlay')

    const reviews = await spiderWeb.getOverlayReviews(overlay.id)
    return ok(reviews)
  } catch (err) {
    return serverError(err)
  }
}

/** POST /api/overlays/[slug]/reviews */
export async function POST(request, { params }) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const slug    = sanitize(params.slug)
    const overlay = await spiderWeb.queryOne(
      `SELECT id FROM overlays WHERE slug = '${slug}' AND status = 'APPROVED' LIMIT 1`
    )
    if (!overlay) return notFound('Overlay')

    const body       = await request.json()
    const { purchaseId, rating, title, reviewBody } = body ?? {}

    if (!purchaseId || !isValidUUID(purchaseId)) {
      return badRequest('purchaseId es obligatorio y debe ser un UUID válido.')
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 10 || !Number.isInteger(rating)) {
      return badRequest('El rating debe ser un número entero entre 1 y 10.')
    }

    // Verificar que la compra pertenezca al usuario y sea de este overlay
    const purchase = await spiderWeb.queryOne(
      `SELECT id FROM purchases
       WHERE id = '${purchaseId}'
         AND buyer_id = '${session.id}'
         AND overlay_id = '${overlay.id}'
         AND status = 'COMPLETED'
       LIMIT 1`
    )
    if (!purchase) {
      return forbidden('Solo podés reseñar overlays que hayas comprado.')
    }

    const review = await spiderWeb.createReview({
      overlayId:  overlay.id,
      userId:     session.id,
      purchaseId,
      rating,
      title:      title  ? sanitize(title)       : null,
      body:       reviewBody ? sanitize(reviewBody) : null,
    })

    return created({ review })
  } catch (err) {
    return serverError(err)
  }
}
