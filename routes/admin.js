import { Router } from 'express';
import { requireAuth } from '../lib/authExpress.js';
import { query, queryOne } from '../lib/db.js';
import { spiderWeb } from '../lib/SpiderWebService.js';

const router = Router();

// Middleware para asegurar que el usuario es admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).render('error', { title: '403 Forbidden', message: 'Acceso denegado. Se requiere rol de administrador.' });
};

router.use(requireAuth);
router.use(requireAdmin);

// ─── GET /admin/settings ───────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    // Cargar modelos de IA con fallback si SpiderIA no responde
    let models = [];
    try {
      const modelsData = await spiderWeb.getIAModels();
      models = modelsData?.models || [];
    } catch (iaErr) {
      console.warn('[Admin/Settings] SpiderIA not available:', iaErr.message);
    }

    const settingRow = await queryOne(`SELECT setting_value FROM site_settings WHERE setting_key = 'ai_model_id'`);
    let currentModelId = settingRow ? JSON.parse(settingRow.setting_value) : null;

    // Stats del sistema
    const stats = {};
    try {
      const [userCount, overlayCount, pendingCount] = await Promise.all([
        queryOne('SELECT COUNT(*) AS cnt FROM users'),
        queryOne('SELECT COUNT(*) AS cnt FROM overlays WHERE status = "APPROVED"'),
        queryOne('SELECT COUNT(*) AS cnt FROM overlays WHERE status = "PENDING"'),
      ]);
      stats.users = userCount?.cnt || 0;
      stats.overlays = overlayCount?.cnt || 0;
      stats.pending = pendingCount?.cnt || 0;
    } catch(e) {}

    res.render('admin_settings', {
      title: 'Admin Settings | SimplyOver',
      models,
      currentModelId,
      success: req.query.success === 'true',
      error: req.query.error || null,
      stats,
    });
  } catch (err) {
    console.error('[Admin Settings Error]', err);
    res.status(500).render('error', { title: '500', message: 'Error interno al cargar configuraciones.' });
  }
});

// ─── POST /admin/settings/ia ──────────────────────────────────────────────────
router.post('/settings/ia', async (req, res) => {
  const { modelId } = req.body;
  if (!modelId) return res.redirect('/admin/settings?error=missing_model');

  try {
    await query(
      `INSERT INTO site_settings (setting_key, setting_value) VALUES ('ai_model_id', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(modelId)]
    );
    res.redirect('/admin/settings?success=true');
  } catch (err) {
    console.error('[Admin Settings Save Error]', err);
    res.redirect('/admin/settings?error=save_failed');
  }
});

// ─── POST /admin/notify ───────────────────────────────────────────────────────
router.post('/notify', async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) return res.redirect('/admin/settings?error=missing_fields');

  try {
    const { sendNotificationEmail } = await import('../lib/email.js');
    const users = await query(`SELECT email FROM users WHERE email IS NOT NULL AND status = 'active'`);

    if (users && users.length > 0) {
      const emails = users.map(u => u.email);
      sendNotificationEmail(emails, subject, message, message).catch(err => console.error('[Admin/Notify Email]', err));
    }

    res.redirect('/admin/settings?success=true');
  } catch (err) {
    console.error('[Admin Notify Error]', err);
    res.redirect('/admin/settings?error=email_failed');
  }
});

// ─── GET /admin/settings/test-email ──────────────────────────────────────────
router.get('/settings/test-email', async (req, res) => {
  try {
    const { sendNotificationEmail } = await import('../lib/email.js');
    const admin = await queryOne('SELECT email FROM users WHERE id = ?', [req.user.id]);
    if (!admin?.email) return res.redirect('/admin/settings?error=no_email');

    await sendNotificationEmail(
      [admin.email],
      'SimplyOver - Test Email ✅',
      '<h2>El sistema de correo funciona correctamente</h2><p>Este es un email de prueba enviado desde el Admin Panel de SimplyOver.</p>',
      'El sistema de correo funciona correctamente.'
    );
    res.redirect('/admin/settings?success=true');
  } catch (err) {
    console.error('[Admin/TestEmail]', err);
    res.redirect('/admin/settings?error=email_failed');
  }
});

// ─── GET /admin/overlays ──────────────────────────────────────────────────────
// Overlays pendientes de aprobación
router.get('/overlays', async (req, res) => {
  try {
    const pending = await query(
      `SELECT o.id, o.name, o.slug, o.description, o.price, o.preview_storage_ids,
              o.created_at, o.tags,
              u.username AS creator_username, u.display_name AS creator_display_name,
              u.email AS creator_email
       FROM overlays o
       JOIN users u ON u.id = o.creator_id
       WHERE o.status = 'PENDING'
       ORDER BY o.created_at ASC`,
      []
    );

    const approved = await query(
      `SELECT o.id, o.name, o.slug, o.price, o.download_count, o.view_count, o.published_at,
              u.username AS creator_username
       FROM overlays o
       JOIN users u ON u.id = o.creator_id
       WHERE o.status = 'APPROVED'
       ORDER BY o.published_at DESC LIMIT 20`,
      []
    );

    res.render('admin_overlays', {
      title: 'Overlay Moderation | SimplyOver',
      pending,
      approved,
      spiderwebUrl: process.env.SPIDERWEBURL || '',
    });
  } catch (err) {
    console.error('[Admin/Overlays]', err);
    res.status(500).render('error', { title: '500', message: 'Error cargando overlays.' });
  }
});

// ─── POST /admin/overlays/:id/approve ────────────────────────────────────────
router.post('/overlays/:id/approve', async (req, res) => {
  try {
    await query(
      `UPDATE overlays SET status = 'APPROVED', published_at = NOW() WHERE id = ?`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin/Approve]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /admin/overlays/:id/reject ─────────────────────────────────────────
router.post('/overlays/:id/reject', async (req, res) => {
  const { reason } = req.body;
  try {
    await query(
      `UPDATE overlays SET status = 'DRAFT' WHERE id = ?`,
      [req.params.id]
    );
    // TODO: notificar al creador por email con el motivo
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin/Reject]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
