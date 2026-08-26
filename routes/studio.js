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
    // Obtener las categorías para el modal
    const categories = await query('SELECT id, name, slug FROM categories ORDER BY name ASC');
    
    res.render('studio_canvas', {
      title: 'Studio Canvas | SimplyOver',
      categories
    });
  } catch (err) {
    console.error('[Studio Error]', err);
    res.status(500).render('error', { title: '500', message: 'Internal Server Error' });
  }
});

// ─── POST /studio/publish ──────────────────────────────────────────────────────
router.post('/publish', requireAuth, upload.fields([{ name: 'previewImage', maxCount: 1 }, { name: 'zipFile', maxCount: 1 }]), async (req, res) => {
  const { name, description, price, tags, category_id } = req.body;
  const files = req.files;

  if (!name || !price || !category_id || !files || !files.previewImage || !files.zipFile) {
    return res.status(400).send('Faltan campos obligatorios o archivos.');
  }

  try {
    const previewFile = files.previewImage[0];
    const zipFile = files.zipFile[0];

    // Subir ambos archivos a SpiderWeb
    // previewFile.buffer es un Buffer, tenemos que usar spiderWeb.uploadFiles
    // SpiderWeb requiere nombres de archivos si son buffers
    const uploadedFiles = await spiderWeb.uploadFiles(
      [previewFile.buffer, zipFile.buffer],
      [previewFile.originalname, zipFile.originalname]
    );

    if (!uploadedFiles || uploadedFiles.length < 2) {
      throw new Error('No se pudieron subir los archivos a SpiderWeb');
    }

    const previewStorageId = uploadedFiles[0].id;
    const zipStorageId = uploadedFiles[1].id;

    // Generar slug
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const exists = await queryOne(`SELECT id FROM overlays WHERE slug = ?`, [slug]);
    if (exists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Parsear tags (string -> JSON array)
    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const safeTagsJson = JSON.stringify(tagArray);

    const overlayId = generateUUID();

    // Insertar overlay en estado PENDING
    await query(
      `INSERT INTO overlays (id, creator_id, name, slug, description, price, zip_storage_id, preview_storage_ids, tags, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
      [overlayId, req.user.id, name, slug, description || '', parseFloat(price), zipStorageId, JSON.stringify([previewStorageId]), safeTagsJson]
    );

    // Insertar en category
    await query(
      `INSERT INTO overlay_categories (overlay_id, category_id) VALUES (?, ?)`,
      [overlayId, category_id]
    );

    res.redirect('/dashboard/library?published=true');
  } catch (err) {
    console.error('[Studio Publish Error]', err);
    res.status(500).send('Error interno al publicar overlay');
  }
});

export default router;
