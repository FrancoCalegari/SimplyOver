/**
 * POST /api/webhooks/mercadopago
 * Webhook de notificación de pagos de Mercado Pago.
 * Confirma la compra y envía el email transaccional con el link de descarga.
 *
 * Mercado Pago envía: { type, data: { id } }
 */

import { MercadoPagoConfig, Payment } from 'mercadopago'
import nodemailer from 'nodemailer'
import { spiderWeb } from '@/lib/SpiderWebService.js'
import { ok, serverError } from '@/lib/apiResponse.js'
import { NextResponse } from 'next/server'

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? '',
})

/** Configura el transporter de Nodemailer desde variables de entorno */
function createMailTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   ?? 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
    },
  })
}

/** Envía el email de confirmación de compra con el link de descarga */
async function sendPurchaseEmail({ buyerEmail, overlayName, purchaseId, downloadToken, overlaySlug }) {
  const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const downloadUrl = `${APP_URL}/api/download?token=${downloadToken}`

  const transporter = createMailTransport()

  await transporter.sendMail({
    from:    process.env.SMTP_FROM ?? '"SimplyOver" <no-reply@simplyover.com>',
    to:      buyerEmail,
    subject: `✅ Tu overlay "${overlayName}" está listo — SimplyOver`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"></head>
      <body style="font-family: 'Segoe UI', sans-serif; background: #0f0f10; color: #e2e8f0; padding: 40px;">
        <div style="max-width: 560px; margin: auto; background: #1a1a2e; border-radius: 16px; padding: 40px;">
          <h1 style="color: #a78bfa; font-size: 24px; margin-bottom: 8px;">¡Compra exitosa! 🎉</h1>
          <p style="color: #94a3b8; margin-bottom: 24px;">
            Gracias por tu compra en <strong style="color: #e2e8f0;">SimplyOver</strong>.
          </p>

          <div style="background: #0f0f1a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">Overlay comprado</p>
            <p style="margin: 8px 0 0; font-size: 20px; font-weight: 700; color: #e2e8f0;">${overlayName}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #475569;">ID de compra: <code>${purchaseId}</code></p>
          </div>

          <a href="${downloadUrl}"
             style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5);
                    color: #fff; text-decoration: none; padding: 14px 28px;
                    border-radius: 10px; font-weight: 600; font-size: 16px;">
            ⬇️ Descargar mi Overlay
          </a>

          <p style="margin-top: 24px; font-size: 12px; color: #475569;">
            Este enlace es válido para <strong>5 descargas</strong>. No lo compartas.<br>
            Si tenés problemas, respondé este mail con tu ID de compra.
          </p>

          <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;">
          <p style="font-size: 11px; color: #334155; text-align: center;">
            SimplyOver · Marketplace de Overlays para OBS
          </p>
        </div>
      </body>
      </html>
    `,
  })
}

export async function POST(request) {
  try {
    const body = await request.json()

    // Mercado Pago envía distintos tipos: 'payment', 'merchant_order', etc.
    if (body?.type !== 'payment') {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const paymentId = body?.data?.id
    if (!paymentId) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // ── Verificar pago directamente con MP ─────────────────
    const paymentApi = new Payment(mpClient)
    const payment    = await paymentApi.get({ id: paymentId })

    const mpStatus       = payment.status             // 'approved' | 'pending' | 'rejected'
    const mpPreferenceId = payment.preference_id
    const buyerEmail     = payment.payer?.email

    // Buscar la Purchase por preference_id
    const purchase = await spiderWeb.queryOne(
      `SELECT p.id, p.overlay_id, p.buyer_id
       FROM purchases p
       WHERE p.mp_preference_id = '${mpPreferenceId}'
       LIMIT 1`
    )

    if (!purchase) {
      // Compra no encontrada — log silencioso
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // ── Confirmar la compra en DB ──────────────────────────
    const confirmed = await spiderWeb.confirmPurchase({
      mpPaymentId: String(paymentId),
      mpStatus,
      purchaseId:  purchase.id,
    })

    // ── Enviar email solo si el pago fue aprobado ──────────
    if (mpStatus === 'approved' && confirmed?.download_token) {
      const overlay = await spiderWeb.queryOne(
        `SELECT o.name, o.slug, u.email AS buyer_email
         FROM overlays o
         JOIN users u ON u.id = '${purchase.buyer_id}'
         WHERE o.id = '${purchase.overlay_id}'
         LIMIT 1`
      )

      const email = buyerEmail ?? overlay?.buyer_email
      if (email && overlay) {
        await sendPurchaseEmail({
          buyerEmail:    email,
          overlayName:   overlay.name,
          overlaySlug:   overlay.slug,
          purchaseId:    purchase.id,
          downloadToken: confirmed.download_token,
        })

        // Registrar envío de email
        await spiderWeb.query(
          `UPDATE purchases
           SET email_sent_at = NOW()
           WHERE id = '${purchase.id}'`
        )
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error('[MP Webhook Error]', err)
    // Devolver 200 para que MP no reintente indefinidamente
    return NextResponse.json({ received: true, warning: 'Internal error' }, { status: 200 })
  }
}
