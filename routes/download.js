/**
 * routes/download.js
 * Sistema de descarga segura de overlays con tokens.
 * GET  /download/:token         — descarga con token de purchase
 * POST /api/purchase/free       — adquirir overlay gratuito y generar token
 */

import { Router } from 'express';
import { query, queryOne, generateUUID } from '../lib/db.js';
import { requireAuth } from '../lib/authExpress.js';
import crypto from 'crypto';

const router = Router();

// ─── POST /api/purchase/free ──────────────────────────────────────────────────
// Crear purchase para overlay gratuito y devolver token de descarga
router.post('/purchase/free', requireAuth, async (req, res) => {
  const { overlayId } = req.body;
  const userId = req.user.id;

  if (!overlayId) return res.status(400).json({ error: 'overlayId required' });

  try {
    // Verificar que el overlay existe y es gratuito
    const overlay = await queryOne(
      `SELECT id, name, price, creator_id, zip_storage_id, status FROM overlays WHERE id = ? AND status = 'APPROVED'`,
      [overlayId]
    );
    if (!overlay) return res.status(404).json({ error: 'Overlay not found' });
    if (parseFloat(overlay.price) > 0) return res.status(400).json({ error: 'This overlay is not free' });
    if (!overlay.zip_storage_id) return res.status(400).json({ error: 'No download file available' });

    // Verificar si ya tiene una purchase COMPLETED para este overlay
    const existing = await queryOne(
      'SELECT id, download_token FROM purchases WHERE buyer_id = ? AND overlay_id = ? AND status = "COMPLETED"',
      [userId, overlayId]
    );
    if (existing) {
      return res.json({ success: true, token: existing.download_token, alreadyOwned: true });
    }

    // Generar token seguro
    const token = crypto.randomBytes(32).toString('hex');
    const purchaseId = generateUUID();

    await query(
      `INSERT INTO purchases (id, buyer_id, overlay_id, creator_id, amount_paid, currency,
         payment_provider, status, download_token, download_count, download_limit, created_at, updated_at, completed_at)
       VALUES (?, ?, ?, ?, 0.00, 'ARS', 'free', 'COMPLETED', ?, 0, 10, NOW(), NOW(), NOW())`,
      [purchaseId, userId, overlayId, overlay.creator_id, token]
    );

    // Incrementar download_count del overlay
    await query('UPDATE overlays SET download_count = download_count + 1 WHERE id = ?', [overlayId]);

    res.json({ success: true, token, purchaseId });
  } catch (err) {
    console.error('[Download/Free]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /download/:token ─────────────────────────────────────────────────────
// Descarga el archivo ZIP del overlay usando el token de purchase
router.get('/:token', requireAuth, async (req, res) => {
  const { token } = req.params;
  const userId = req.user.id;

  try {
    const purchase = await queryOne(
      `SELECT p.id, p.download_count, p.download_limit, p.status,
              o.zip_storage_id, o.name, o.id AS overlay_id
       FROM purchases p
       JOIN overlays o ON o.id = p.overlay_id
       WHERE p.download_token = ? AND p.buyer_id = ? AND p.status = 'COMPLETED'`,
      [token, userId]
    );

    if (!purchase) {
      return res.status(403).render('error', {
        title: 'Access Denied | SimplyOver',
        message: 'Token de descarga inválido o acceso denegado.'
      });
    }

    if (purchase.download_count >= purchase.download_limit) {
      return res.status(403).render('error', {
        title: 'Límite Alcanzado | SimplyOver',
        message: `Has alcanzado el límite de ${purchase.download_limit} descargas para este overlay.`
      });
    }

    if (!purchase.zip_storage_id) {
      return res.status(404).render('error', {
        title: 'Archivo no disponible | SimplyOver',
        message: 'El archivo de este overlay no está disponible temporalmente.'
      });
    }

    // Incrementar contador de descargas
    await query('UPDATE purchases SET download_count = download_count + 1 WHERE id = ?', [purchase.id]);
    await query('UPDATE overlays SET download_count = download_count + 1 WHERE id = ?', [purchase.overlay_id]);

    // Proxy del archivo desde SpiderWeb con X-API-KEY
    const fileUrl = `${process.env.SPIDERWEBURL}/storage/files/${purchase.zip_storage_id}`;
    const fileRes = await fetch(fileUrl, {
      headers: { 'X-API-KEY': process.env.SPIDERWEBAPIKEY }
    });

    if (!fileRes.ok) {
      return res.status(502).render('error', {
        title: 'Error de descarga | SimplyOver',
        message: 'No se pudo obtener el archivo. Intenta más tarde.'
      });
    }

    const safeName = purchase.name.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.zip"`);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Cache-Control', 'no-store');

    const buffer = await fileRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('[Download/Token]', err);
    res.status(500).render('error', {
      title: 'Error | SimplyOver',
      message: 'Error interno al procesar la descarga.'
    });
  }
});

export default router;
