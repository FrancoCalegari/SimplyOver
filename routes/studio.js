/**
 * routes/studio.js
 * Backend del Studio de creación de overlays.
 * 
 * GET    /studio              — Canvas principal de publicación
 * POST   /studio/publish      — Publicar overlay (upload a SpiderWeb + insertar en DB)
 * GET    /studio/drafts       — Listar drafts del usuario (JSON)
 * POST   /studio/drafts       — Crear/guardar draft del canvas
 * PUT    /studio/drafts/:id   — Actualizar draft
 * DELETE /studio/drafts/:id   — Eliminar draft
 * GET    /studio/my-overlays  — Overlays del usuario autenticado (gestión)
 * DELETE /studio/overlay/:id  — Eliminar un overlay propio
 */

import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../lib/authExpress.js';
import { query, queryOne, generateUUID } from '../lib/db.js';
import { spiderWeb } from '../lib/SpiderWebService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─── GET /studio ───────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const categories = await query('SELECT id, name, slug FROM categories ORDER BY name ASC');
    res.render('studio_upload', {
      title: 'Publish Overlay | SimplyOver',
      categories,
    });
  } catch (err) {
    console.error('[Studio Error]', err);
    res.status(500).render('error', { title: '500', message: 'Internal Server Error' });
  }
});

// ─── GET /studio/canvas ────────────────────────────────────────────────────────
router.get('/canvas', requireAuth, async (req, res) => {
  try {
    const categories = await query('SELECT id, name, slug FROM categories ORDER BY name ASC');

    // Pre-cargar draft si viene desde ?draftId
    let preloadedDraft = null;
    if (req.query.draftId) {
      preloadedDraft = await queryOne(
        'SELECT * FROM canvas_drafts WHERE id = ? AND creator_id = ?',
        [req.query.draftId, req.user.id]
      );
    }

    res.render('studio_canvas', {
      title: 'Studio Web Editor | SimplyOver',
      categories,
      preloadedDraft,
    });
  } catch (err) {
    console.error('[Studio Canvas Error]', err);
    res.status(500).render('error', { title: '500', message: 'Internal Server Error' });
  }
});

// ─── POST /studio/publish ──────────────────────────────────────────────────────
router.post('/publish', requireAuth,
  upload.fields([
    { name: 'previewImages', maxCount: 5 },  // hasta 5 previews
    { name: 'zipFile', maxCount: 1 }
  ]),
  async (req, res) => {
    const { name, description, short_description, price, tags, resolution, software_version } = req.body;
    // category_ids puede ser string (una) o array (múltiples)
    let categoryIds = req.body.category_ids || req.body.category_id;
    if (!Array.isArray(categoryIds)) categoryIds = categoryIds ? [categoryIds] : [];

    const files = req.files;

    if (!name || price === undefined || categoryIds.length === 0 || !files?.zipFile) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, precio, categoría, archivo ZIP).' });
    }

    try {
      const previewFiles = files.previewImages || [];
      const zipFile = files.zipFile[0];

      // Subir ZIP a SpiderWeb
      const uploadedFiles = [];

      // Subir previews
      for (const pf of previewFiles) {
        const [uploaded] = await spiderWeb.uploadFiles(
          [pf.buffer],
          [pf.originalname]
        );
        if (uploaded?.id) uploadedFiles.push(uploaded.id);
      }

      // Subir ZIP
      const [uploadedZip] = await spiderWeb.uploadFiles(
        [zipFile.buffer],
        [zipFile.originalname]
      );

      if (!uploadedZip?.id) {
        throw new Error('No se pudo subir el archivo ZIP a SpiderWeb');
      }

      // Generar slug único
      let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const slugExists = await queryOne('SELECT id FROM overlays WHERE slug = ?', [slug]);
      if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

      // Parsear tags
      const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      const overlayId = generateUUID();

      // Insertar overlay en estado PENDING
      await query(
        `INSERT INTO overlays (id, creator_id, name, slug, description, short_description, price, currency,
           zip_storage_id, preview_storage_ids, tags, status, resolution, software_version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ARS', ?, ?, ?, 'PENDING', ?, ?, NOW(), NOW())`,
        [
          overlayId, req.user.id, name, slug,
          description || '',
          short_description || (description || '').substring(0, 200),
          parseFloat(price),
          uploadedZip.id,
          JSON.stringify(uploadedFiles),
          JSON.stringify(tagArray),
          resolution || '1920x1080',
          software_version || null,
        ]
      );

      // Insertar en todas las categorías seleccionadas
      for (const catId of categoryIds) {
        await query(
          'INSERT IGNORE INTO overlay_categories (overlay_id, category_id) VALUES (?, ?)',
          [overlayId, catId]
        );
      }

      // Si viene con draftId, marcar como publicado
      if (req.body.draftId) {
        await query(
          'UPDATE canvas_drafts SET status = "PUBLISHED", overlay_id = ?, updated_at = NOW() WHERE id = ? AND creator_id = ?',
          [overlayId, req.body.draftId, req.user.id]
        );
      }

      // Responder según tipo de request
      if (req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, overlayId, message: 'Overlay enviado a revisión.' });
      }
      res.redirect('/dashboard/projects?published=true');
    } catch (err) {
      console.error('[Studio Publish Error]', err);
      if (req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ error: 'Error interno al publicar overlay: ' + err.message });
      }
      res.status(500).send('Error interno al publicar overlay');
    }
  }
);

// ─── GET /studio/drafts ───────────────────────────────────────────────────────
router.get('/drafts', requireAuth, async (req, res) => {
  try {
    const drafts = await query(
      `SELECT id, name, status, created_at, updated_at, overlay_id
       FROM canvas_drafts WHERE creator_id = ? ORDER BY updated_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ drafts });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /studio/drafts ──────────────────────────────────────────────────────
router.post('/drafts', requireAuth, async (req, res) => {
  const { name, canvas_data } = req.body;
  try {
    const id = generateUUID();
    await query(
      `INSERT INTO canvas_drafts (id, creator_id, name, canvas_data, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'DRAFT', NOW(), NOW())`,
      [id, req.user.id, name || 'Untitled Draft', JSON.stringify(canvas_data || {})]
    );
    res.json({ success: true, draftId: id });
  } catch (err) {
    console.error('[Studio/Drafts/Create]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /studio/drafts/:id ───────────────────────────────────────────────────
router.put('/drafts/:id', requireAuth, async (req, res) => {
  const { name, canvas_data } = req.body;
  try {
    const draft = await queryOne(
      'SELECT id FROM canvas_drafts WHERE id = ? AND creator_id = ?',
      [req.params.id, req.user.id]
    );
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    await query(
      'UPDATE canvas_drafts SET name = ?, canvas_data = ?, updated_at = NOW() WHERE id = ?',
      [name, JSON.stringify(canvas_data || {}), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Studio/Drafts/Update]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /studio/drafts/:id ────────────────────────────────────────────────
router.delete('/drafts/:id', requireAuth, async (req, res) => {
  try {
    const draft = await queryOne(
      'SELECT id FROM canvas_drafts WHERE id = ? AND creator_id = ?',
      [req.params.id, req.user.id]
    );
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    await query('DELETE FROM canvas_drafts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Studio/Drafts/Delete]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /studio/my-overlays ──────────────────────────────────────────────────
// Overlays publicados/pendientes del usuario, para gestión
router.get('/my-overlays', requireAuth, async (req, res) => {
  try {
    const overlays = await query(
      `SELECT o.id, o.name, o.slug, o.price, o.status, o.preview_storage_ids,
              o.view_count, o.download_count, o.created_at, o.published_at
       FROM overlays o
       WHERE o.creator_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ overlays });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /studio/overlay/:id ───────────────────────────────────────────────
router.delete('/overlay/:id', requireAuth, async (req, res) => {
  try {
    const overlay = await queryOne(
      'SELECT id, status FROM overlays WHERE id = ? AND creator_id = ?',
      [req.params.id, req.user.id]
    );
    if (!overlay) return res.status(404).json({ error: 'Overlay not found' });
    if (overlay.status === 'APPROVED') {
      return res.status(400).json({ error: 'Cannot delete an approved overlay. Contact admin.' });
    }
    await query('DELETE FROM overlays WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Studio/DeleteOverlay]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
