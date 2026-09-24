import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth } from '../lib/authExpress.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const overlays = await query(
      `SELECT id, name, slug, price, status, view_count, download_count, created_at, preview_storage_ids
       FROM overlays
       WHERE creator_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.render('dashboard_projects', {
      title: 'My Projects | SimplyOver',
      activeTab: 'projects',
      overlays,
      published: req.query.published === 'true'
    });
  } catch (err) {
    console.error('[My Projects]', err);
    res.status(500).send('Server Error');
  }
});

export default router;
