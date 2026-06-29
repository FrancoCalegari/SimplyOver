/**
 * POST /api/checkout
 * Inicia el flujo de compra de un overlay.
 * Crea la Purchase en DB y la preferencia en Mercado Pago.
 *
 * Body: { overlayId }
 * Responde: { ok, data: { purchaseId, initPoint, preferenceId } }
 */

import { MercadoPagoConfig, Preference } from 'mercadopago'
import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import {
  ok, badRequest, serverError, sanitize, isValidUUID,
} from '@/lib/apiResponse.js'

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? '',
})

export async function POST(request) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const body      = await request.json()
    const overlayId = body?.overlayId

    if (!overlayId || !isValidUUID(overlayId)) {
      return badRequest('overlayId es obligatorio y debe ser un UUID válido.')
    }

    // ── Obtener overlay con datos del creador ──────────────
    const overlay = await spiderWeb.queryOne(
      `SELECT o.id, o.name, o.price, o.currency, o.creator_id,
              u.email AS creator_email
       FROM overlays o
       JOIN users u ON u.id = o.creator_id
       WHERE o.id = '${overlayId}' AND o.status = 'APPROVED'
       LIMIT 1`
    )
    if (!overlay) return badRequest('Overlay no encontrado o no disponible.')
    if (overlay.price === 0) return badRequest('Este overlay es gratuito. No requiere pago.')

    // ── Verificar si ya fue comprado ───────────────────────
    const alreadyOwned = await spiderWeb.queryOne(
      `SELECT id FROM purchases
       WHERE buyer_id = '${session.id}'
         AND overlay_id = '${overlayId}'
         AND status = 'COMPLETED'
       LIMIT 1`
    )
    if (alreadyOwned) return badRequest('Ya compraste este overlay.')

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // ── Crear preferencia en Mercado Pago ──────────────────
    const preference = new Preference(mpClient)
    const mpResponse = await preference.create({
      body: {
        items: [
          {
            id:          overlay.id,
            title:       overlay.name,
            description: `Overlay para OBS — SimplyOver`,
            quantity:    1,
            currency_id: overlay.currency ?? 'ARS',
            unit_price:  parseFloat(overlay.price),
          },
        ],
        payer: {
          email: session.email,
        },
        back_urls: {
          success: `${APP_URL}/checkout/success`,
          failure: `${APP_URL}/checkout/failure`,
          pending: `${APP_URL}/checkout/pending`,
        },
        auto_return:       'approved',
        notification_url:  `${APP_URL}/api/webhooks/mercadopago`,
        statement_descriptor: 'SIMPLYOVER',
        metadata: {
          buyer_id:   session.id,
          overlay_id: overlayId,
        },
      },
    })

    // ── Crear Purchase en DB ───────────────────────────────
    const purchase = await spiderWeb.createPurchase({
      buyerId:        session.id,
      overlayId:      overlay.id,
      creatorId:      overlay.creator_id,
      amountPaid:     parseFloat(overlay.price),
      currency:       overlay.currency ?? 'ARS',
      mpPreferenceId: mpResponse.id,
    })

    return ok({
      purchaseId:   purchase.id,
      preferenceId: mpResponse.id,
      initPoint:    mpResponse.init_point,    // URL de checkout MP (producción)
      sandboxUrl:   mpResponse.sandbox_init_point, // URL de sandbox
    })
  } catch (err) {
    return serverError(err)
  }
}
