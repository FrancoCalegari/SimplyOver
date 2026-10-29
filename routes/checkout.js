/**
 * routes/checkout.js
 * Pasarela de pago SimplyOver — Modo Demostración & Listo para Mercado Pago Checkout Pro.
 * 
 * Rutas:
 * - GET  /checkout/:overlayId      -> Vista de Checkout con pasarela interactiva y resumen
 * - GET  /checkout                 -> Redirige al demo o primer overlay de pago
 * - GET  /checkout/success         -> Vista de confirmación / éxito
 * - GET  /checkout/failure         -> Vista de pago rechazado
 * - GET  /checkout/pending         -> Vista de pago pendiente
 * - POST /api/checkout/preference  -> Genera preferencia de Mercado Pago (real o demo)
 * - POST /api/checkout/simulate    -> Procesa pago simulado en modo demostración y registra en DB
 */

import { Router } from 'express';
import crypto from 'crypto';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { query, queryOne, generateUUID } from '../lib/db.js';
import { optionalAuth } from '../lib/authExpress.js';

const router = Router();

// Helper: Verifica si las credenciales de Mercado Pago están listas para producción
function isMercadoPagoConfigured() {
  const token = process.env.MP_ACCESS_TOKEN || '';
  const pubKey = process.env.MP_PUBLIC_KEY || '';
  return (
    token.length > 20 &&
    !token.includes('xxxx') &&
    pubKey.length > 20 &&
    !pubKey.includes('xxxx')
  );
}

// ── GET /checkout (Redirect a demo o primer overlay de pago) ────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const paidOverlay = await queryOne(
      `SELECT id FROM overlays WHERE price > 0 AND status = 'APPROVED' ORDER BY price DESC LIMIT 1`
    );
    if (paidOverlay) {
      return res.redirect(`/checkout/${paidOverlay.id}`);
    }
  } catch (err) {
    console.warn('[Checkout Redirect]', err.message);
  }
  return res.redirect('/checkout/demo');
});

// ── GET /checkout/success ───────────────────────────────────────────────────
router.get('/success', optionalAuth, async (req, res) => {
  const { overlayId, payment_id, preference_id, status } = req.query;
  res.render('checkout_result', {
    title: '¡Pago Exitoso! | SimplyOver',
    status: 'approved',
    paymentId: payment_id || 'MP-DEMO-' + Date.now(),
    preferenceId: preference_id || '',
    overlayId: overlayId || '',
    user: req.user,
    message: 'Tu pago fue procesado correctamente por Mercado Pago.'
  });
});

// ── GET /checkout/failure ───────────────────────────────────────────────────
router.get('/failure', optionalAuth, async (req, res) => {
  const { overlayId, payment_id } = req.query;
  res.render('checkout_result', {
    title: 'Pago No Completado | SimplyOver',
    status: 'rejected',
    paymentId: payment_id || '',
    overlayId: overlayId || '',
    user: req.user,
    message: 'El pago no pudo ser completado. Puedes intentar nuevamente con otro medio de pago.'
  });
});

// ── GET /checkout/pending ───────────────────────────────────────────────────
router.get('/pending', optionalAuth, async (req, res) => {
  const { overlayId, payment_id } = req.query;
  res.render('checkout_result', {
    title: 'Pago Pendiente | SimplyOver',
    status: 'pending',
    paymentId: payment_id || '',
    overlayId: overlayId || '',
    user: req.user,
    message: 'Tu pago se encuentra pendiente de acreditación (Rapipago / Pago Fácil / Transferencia).'
  });
});

// ── GET /checkout/:overlayId ────────────────────────────────────────────────
router.get('/:overlayId', optionalAuth, async (req, res) => {
  const { overlayId } = req.params;
  const isDemoOverlay = !overlayId || overlayId === 'demo';

  let overlay = null;
  let alreadyPurchased = false;
  let purchaseData = null;

  try {
    if (!isDemoOverlay) {
      overlay = await queryOne(
        `SELECT o.id, o.name, o.slug, o.description, o.short_description, o.price, o.currency,
                o.tags, o.software_version, o.resolution, o.preview_storage_ids, o.creator_id,
                o.zip_storage_id,
                u.username AS creator_username, u.display_name AS creator_display_name, u.avatar_storage_id AS creator_avatar
         FROM overlays o
         JOIN users u ON u.id = o.creator_id
         WHERE o.id = ? OR o.slug = ?
         LIMIT 1`,
        [overlayId, overlayId]
      );
    }

    // Verificar si el usuario autenticado ya compró este overlay
    if (overlay && req.user) {
      purchaseData = await queryOne(
        `SELECT id, download_token, download_count, download_limit, completed_at
         FROM purchases
         WHERE buyer_id = ? AND overlay_id = ? AND status = 'COMPLETED'
         LIMIT 1`,
        [req.user.id, overlay.id]
      );
      if (purchaseData) {
        alreadyPurchased = true;
      }
    }
  } catch (err) {
    console.error('[Checkout Route Error]', err);
  }

  // Fallback si no existe o se solicitó explícitamente modo demo
  if (!overlay) {
    overlay = {
      id: 'c1e14ed5-9ec5-4f2f-98ad-0a589ff10a0a',
      name: 'Cyberpunk 2077 HUD & Streamer Pack Pro',
      slug: 'cyberpunk-streamer-pack-pro',
      description: 'Paquete integral para creadores de contenido y streamers de Twitch, Kick y YouTube. Incluye alertas reactivas con sonido sincronizado, marcos de cámara dinámica con efecto glitch suave, overlay de chat interactivo, pantallas de Comenzando Pronto, Ya Volvemos y Fin del Stream.',
      short_description: 'Paquete profesional completo con animaciones fluidas a 60 FPS y configuración lista para OBS Studio.',
      price: '499.00',
      currency: 'ARS',
      tags: ['Cyberpunk', 'Animado', '60 FPS', 'OBS Studio', 'Alertas'],
      software_version: 'OBS Studio 30+ / Streamlabs',
      resolution: '1920x1080 Full HD',
      creator_username: 'cyber_artisan',
      creator_display_name: 'CyberArtisan Studio',
      creator_avatar: null,
      previewIds: []
    };
  } else {
    // Normalizar tags y previews
    try {
      if (typeof overlay.tags === 'string') overlay.tags = JSON.parse(overlay.tags || '[]');
    } catch {
      overlay.tags = [];
    }
    try {
      if (typeof overlay.preview_storage_ids === 'string') {
        overlay.previewIds = JSON.parse(overlay.preview_storage_ids || '[]');
      } else if (Array.isArray(overlay.preview_storage_ids)) {
        overlay.previewIds = overlay.preview_storage_ids;
      } else {
        overlay.previewIds = [];
      }
    } catch {
      overlay.previewIds = [];
    }
  }

  const mpConfigured = isMercadoPagoConfigured();
  const mpPublicKey = process.env.MP_PUBLIC_KEY || '';

  res.render('checkout', {
    title: `Checkout Seguro | ${overlay.name} — SimplyOver`,
    overlay,
    user: req.user || null,
    alreadyPurchased,
    purchaseData,
    mpConfigured,
    mpPublicKey,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    availableCoupons: [
      { code: 'DEMO50', discount: 50, type: 'percent', label: '50% OFF (Demostración)' },
      { code: 'STREAMER100', discount: 100, type: 'percent', label: '100% OFF (Prueba Gratuita)' },
      { code: 'LAUNCH20', discount: 20, type: 'percent', label: '20% OFF (Lanzamiento)' }
    ]
  });
});

// ── POST /preference & /api/preference ───────────────────────────────────────────
router.post(['/preference', '/api/preference'], optionalAuth, async (req, res) => {
  try {
    const { overlayId, couponCode } = req.body;
    if (!overlayId) {
      return res.status(400).json({ ok: false, error: 'overlayId es requerido' });
    }

    let overlay = await queryOne(
      `SELECT id, name, price, currency, creator_id FROM overlays WHERE id = ? LIMIT 1`,
      [overlayId]
    );

    if (!overlay) {
      overlay = {
        id: overlayId,
        name: 'Cyberpunk HUD Streamer Pack Pro (Demo)',
        price: '499.00',
        currency: 'ARS',
        creator_id: req.user?.id || 'demo-creator-id'
      };
    }

    let unitPrice = parseFloat(overlay.price) || 499.00;

    // Aplicar cupón de descuento si existe
    if (couponCode) {
      const code = couponCode.trim().toUpperCase();
      if (code === 'DEMO50') unitPrice = unitPrice * 0.5;
      else if (code === 'STREAMER100') unitPrice = 0.00;
      else if (code === 'LAUNCH20') unitPrice = unitPrice * 0.8;
    }

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const mpConfigured = isMercadoPagoConfigured();

    // Si hay credenciales reales de Mercado Pago configuradas:
    if (mpConfigured) {
      try {
        const mpClient = new MercadoPagoConfig({
          accessToken: process.env.MP_ACCESS_TOKEN.trim(),
        });
        const preference = new Preference(mpClient);
        const mpResponse = await preference.create({
          body: {
            items: [
              {
                id: overlay.id,
                title: overlay.name,
                description: `Overlay para OBS Studio — SimplyOver`,
                quantity: 1,
                currency_id: overlay.currency || 'ARS',
                unit_price: unitPrice,
              },
            ],
            payer: {
              email: req.user?.email || 'comprador@simplyover.com',
            },
            back_urls: {
              success: `${APP_URL}/checkout/success?overlayId=${overlay.id}`,
              failure: `${APP_URL}/checkout/failure?overlayId=${overlay.id}`,
              pending: `${APP_URL}/checkout/pending?overlayId=${overlay.id}`,
            },
            auto_return: 'approved',
            notification_url: `${APP_URL}/api/webhooks/mercadopago`,
            statement_descriptor: 'SIMPLYOVER',
            metadata: {
              buyer_id: req.user?.id || 'guest',
              overlay_id: overlay.id,
            },
          },
        });

        return res.json({
          ok: true,
          isDemo: false,
          preferenceId: mpResponse.id,
          initPoint: mpResponse.init_point,
          sandboxUrl: mpResponse.sandbox_init_point,
          publicKey: process.env.MP_PUBLIC_KEY
        });
      } catch (mpErr) {
        console.warn('[MercadoPago API Warning] Error creando preferencia real, recurriendo a modo demo:', mpErr.message);
      }
    }

    // Modo Demostración / Simulación
    const demoPrefId = `DEMO_PREF_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return res.json({
      ok: true,
      isDemo: true,
      preferenceId: demoPrefId,
      initPoint: `${APP_URL}/checkout/${overlay.id}?demo_pref=${demoPrefId}`,
      sandboxUrl: `${APP_URL}/checkout/${overlay.id}?demo_pref=${demoPrefId}`,
      publicKey: process.env.MP_PUBLIC_KEY || 'TEST-DEMO-SIMULATION-KEY',
      message: 'Checkout Pro listo. Modo simulación activo.'
    });
  } catch (err) {
    console.error('[Preference Error]', err);
    res.status(500).json({ ok: false, error: 'Error interno generando la preferencia de pago' });
  }
});

// ── POST /simulate & /api/simulate (Ejecutar compra simulada para demo) ─────────
router.post(['/simulate', '/api/simulate'], optionalAuth, async (req, res) => {
  try {
    const {
      overlayId,
      outcome = 'approved', // 'approved' | 'rejected' | 'pending'
      paymentMethod = 'mercadopago_checkout_pro',
      cardLast4 = '4242',
      installments = 1,
      buyerEmail,
      buyerName,
      discount = 0
    } = req.body;

    if (!overlayId) {
      return res.status(400).json({ ok: false, error: 'overlayId es requerido' });
    }

    // Buscar overlay en DB
    let overlay = await queryOne(
      `SELECT id, name, price, currency, creator_id, zip_storage_id FROM overlays WHERE id = ? LIMIT 1`,
      [overlayId]
    );

    if (!overlay) {
      overlay = {
        id: overlayId,
        name: 'Cyberpunk HUD Streamer Pack Pro',
        price: '499.00',
        currency: 'ARS',
        creator_id: req.user?.id || 'demo-creator-id',
        zip_storage_id: 'sample-zip-id'
      };
    }

    const originalPrice = parseFloat(overlay.price) || 499.00;
    const finalAmount = Math.max(0, originalPrice - (originalPrice * (parseFloat(discount) / 100)));

    // Si la simulación es de RECHAZO:
    if (outcome === 'rejected') {
      return res.status(400).json({
        ok: false,
        status: 'rejected',
        error: 'Tu tarjeta fue rechazada por la entidad bancaria emisor.',
        reason: 'Fondos insuficientes o límite de compras por internet excedido (Código de rechazo: cc_rejected_insufficient_amount).'
      });
    }

    // Si la simulación es de PENDIENTE:
    if (outcome === 'pending') {
      const barcode = '27' + Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
      return res.json({
        ok: true,
        status: 'pending',
        barcode,
        paymentId: 'MP-PEND-' + Date.now(),
        message: 'Cupón de pago emitido. Puedes abonar en sucursales de Rapipago o Pago Fácil en las próximas 48 horas.'
      });
    }

    // Si la simulación es de APROBADO:
    const downloadToken = crypto.randomBytes(32).toString('hex');
    const purchaseId = generateUUID();
    const mpPaymentId = 'MP-SIM-' + Math.floor(1000000000 + Math.random() * 9000000000);
    let purchaseSaved = false;

    // Si el usuario está logueado, guardamos la compra en MariaDB/SpiderWeb
    if (req.user && req.user.id) {
      try {
        await query(
          `INSERT INTO purchases (
            id, buyer_id, overlay_id, creator_id, amount_paid, currency,
            payment_provider, mp_payment_id, mp_preference_id, mp_status,
            status, download_token, download_count, download_limit,
            created_at, updated_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'mercadopago_demo', ?, ?, 'approved', 'COMPLETED', ?, 0, 10, NOW(), NOW(), NOW())`,
          [
            purchaseId,
            req.user.id,
            overlay.id,
            overlay.creator_id || req.user.id,
            finalAmount,
            overlay.currency || 'ARS',
            mpPaymentId,
            'PREF-SIM-' + Date.now(),
            downloadToken
          ]
        );

        // Incrementar descargas del overlay
        await query('UPDATE overlays SET download_count = download_count + 1 WHERE id = ?', [overlay.id]);
        purchaseSaved = true;
      } catch (dbErr) {
        console.warn('[Checkout DB Simulation Notice]', dbErr.message);
      }
    }

    return res.json({
      ok: true,
      status: 'approved',
      purchaseId,
      mpPaymentId,
      downloadToken,
      purchaseSaved,
      overlay: {
        id: overlay.id,
        name: overlay.name,
        price: finalAmount.toFixed(2),
        currency: overlay.currency || 'ARS'
      },
      buyer: {
        name: buyerName || req.user?.display_name || req.user?.username || 'Streamer Comprador',
        email: buyerEmail || req.user?.email || 'streamer@demo.com'
      },
      paymentDetails: {
        method: paymentMethod,
        cardLast4,
        installments: parseInt(installments) || 1,
        date: new Date().toLocaleDateString('es-AR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    });

  } catch (err) {
    console.error('[Checkout Simulate Error]', err);
    res.status(500).json({ ok: false, error: 'Error procesando la simulación' });
  }
});

export default router;
