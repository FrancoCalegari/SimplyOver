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
    const modelsData = await spiderWeb.getIAModels();
    const models = modelsData?.models || [];
    
    const settingRow = await queryOne(`SELECT setting_value FROM site_settings WHERE setting_key = 'ai_model_id'`);
    let currentModelId = settingRow ? JSON.parse(settingRow.setting_value) : null;
    
    res.render('admin_settings', {
      title: 'Admin Settings | SimplyOver',
      models,
      currentModelId,
      success: req.query.success === 'true'
    });
  } catch (err) {
    console.error('[Admin Settings Error]', err);
    res.status(500).render('error', { title: '500', message: 'Error interno al cargar configuraciones.' });
  }
});

// ─── POST /admin/settings/ia ──────────────────────────────────────────────────
router.post('/settings/ia', async (req, res) => {
  const { modelId } = req.body;
  if (!modelId) return res.status(400).send('Falta modelId');

  try {
    await query(
      `INSERT INTO site_settings (setting_key, setting_value) VALUES ('ai_model_id', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(modelId)]
    );
    res.redirect('/admin/settings?success=true');
  } catch (err) {
    console.error('[Admin Settings Save Error]', err);
    res.status(500).send('Error guardando configuracion');
  }
});

export default router;
