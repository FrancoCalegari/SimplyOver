import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { query as dbQuery, queryOne, generateUUID } from './lib/db.js';
import { loadCategories } from './middleware/categories.js';

// ── Config ────────────────────────────────────────────────────
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Template Engine ───────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ── Auth middleware global (no bloquea, solo expone req.user) ─
import { optionalAuth } from './lib/authExpress.js';
app.use(optionalAuth);

// ── Categorías globales para navbar ───────────────────────────
app.use(loadCategories);

// ── Proxy de Archivos de SpiderWeb ────────────────────────────
// Permite cargar imágenes en el frontend ya que SpiderWeb requiere X-API-KEY
app.get('/api/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    
    // Evitar consultar al backend si el ID es inválido (ej: templates que pasaron "null")
    if (!fileId || fileId === 'null' || fileId === 'undefined') {
      return res.redirect('/images/placeholder.svg');
    }

    const fetchRes = await fetch(`${process.env.SPIDERWEBURL}/storage/files/${fileId}`, {
      headers: { 'X-API-KEY': process.env.SPIDERWEBAPIKEY }
    });
    
    if (!fetchRes.ok) {
      // Si la imagen no existe o hay error, mostrar el placeholder de "No Image"
      return res.redirect('/images/placeholder.svg');
    }
    
    const contentType = fetchRes.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    
    // Configurar cache para mejorar rendimiento
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    const buffer = await fetchRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('[File Proxy]', err);
    res.redirect('/images/placeholder.svg');
  }
});

// ── Routers modulares ─────────────────────────────────────────
import authRouter      from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import libraryRouter   from './routes/library.js';
import projectsRouter  from './routes/projects.js';
import boardsRouter    from './routes/boards.js';
import messagesRouter  from './routes/messages.js';
import aiRouter        from './routes/ai.js';
import favoritesRouter from './routes/favorites.js';
import adminRouter     from './routes/admin.js';
import profileRouter   from './routes/profile.js';
import studioRouter    from './routes/studio.js';
import downloadRouter  from './routes/download.js';
import friendsRouter   from './routes/friends.js';

app.use('/auth',          authRouter);
app.use('/category',      categoriesRouter);
app.use('/dashboard/library', libraryRouter);
app.use('/dashboard/projects', projectsRouter);
app.use('/boards',        boardsRouter);
app.use('/messages',      messagesRouter);
app.use('/api',           aiRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/friends',   friendsRouter);
app.use('/admin',         adminRouter);
app.use('/profile',       profileRouter);
app.use('/studio',        studioRouter);
app.use('/download',      downloadRouter);

// /studio/ai handled by aiRouter's GET /studio/ai route
app.get('/studio/ai', async (req, res, next) => {
  if (!req.user) return res.redirect('/login?error=session_required');
  res.render('ai_studio', { title: 'AI Studio | SimplyOver' });
});

// ── Frontend Routes ───────────────────────────────────────────
app.get('/', async (req, res) => {
  const { category: catSlug, price, sort = 'newest', page = 1, q } = req.query;
  const perPage = 24;
  const offset = (parseInt(page) - 1) * perPage;

  try {
    // Categorías para el sidebar
    const categories = await dbQuery('SELECT id, slug, name, icon FROM categories ORDER BY name ASC', []);

    // Query base de overlays aprobados
    let sql = `
      SELECT o.id, o.name, o.slug, o.price, o.preview_storage_ids, o.tags, o.is_featured,
             u.username AS creator_username, u.display_name AS creator_display_name,
             u.avatar_storage_id AS creator_avatar,
             ROUND(AVG(r.rating), 1) AS avg_rating,
             COUNT(DISTINCT r.id) AS review_count
      FROM overlays o
      JOIN users u ON u.id = o.creator_id
      LEFT JOIN reviews r ON r.overlay_id = o.id
      LEFT JOIN overlay_categories oc ON oc.overlay_id = o.id
      LEFT JOIN categories c ON c.id = oc.category_id
      WHERE o.status = 'APPROVED'
    `;
    const params = [];

    // Búsqueda por texto
    if (q && q.trim().length > 0) {
      sql += ' AND (o.name LIKE ? OR o.short_description LIKE ? OR o.tags LIKE ?)';
      params.push(`%${q.trim()}%`, `%${q.trim()}%`, `%${q.trim()}%`);
    }

    // Filtro por categoría
    if (catSlug) {
      sql += ' AND c.slug = ?';
      params.push(catSlug);
    }

    // Filtro por precio
    if (price === 'free') {
      sql += ' AND o.price = 0';
    } else if (price === 'paid') {
      sql += ' AND o.price > 0';
    }

    sql += ' GROUP BY o.id, u.id';

    // Ordenamiento
    switch (sort) {
      case 'popular': sql += ' ORDER BY o.view_count DESC'; break;
      case 'rating':  sql += ' ORDER BY avg_rating DESC'; break;
      case 'price_asc': sql += ' ORDER BY o.price ASC'; break;
      case 'price_desc': sql += ' ORDER BY o.price DESC'; break;
      case 'trending': sql += ' ORDER BY o.download_count DESC'; break;
      default: sql += ' ORDER BY o.published_at DESC';
    }

    sql += ` LIMIT ${perPage} OFFSET ${offset}`;

    const overlays = await dbQuery(sql, params);

    res.render('index', {
      title: q ? `"${q}" — SimplyOver` : 'SimplyOver | High-Performance OBS Overlay Marketplace',
      overlays,
      categories,
      filters: { category: catSlug, price, sort, q: q || '' },
      pagination: { page: parseInt(page), perPage, hasMore: overlays.length === perPage },
      spiderwebUrl: process.env.SPIDERWEBURL || '',
    });
  } catch (err) {
    console.error('[Index]', err);
    res.render('index', {
      title: 'SimplyOver | High-Performance OBS Overlay Marketplace',
      overlays: [],
      categories: [],
      filters: { category: catSlug, price, sort, q: q || '' },
      pagination: { page: 1, perPage, hasMore: false },
      spiderwebUrl: process.env.SPIDERWEBURL || '',
    });
  }
});

app.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  const { tab = 'login', error } = req.query;
  res.render('login', {
    title: 'SimplyOver - Login / Register',
    tab,
    error: error || null,
  });
});

app.get('/dashboard/boards', async (req, res) => {
  res.redirect('/boards');  // El router maneja esto
});

app.get('/artist/:username', async (req, res) => {
  try {
    const artist = await queryOne(
      `SELECT id, username, display_name, bio, avatar_storage_id, banner_storage_id,
              link_twitch, link_instagram, link_tiktok, link_kick, link_web, link_email,
              link_pinterest, artist_tags, created_at, role
       FROM users WHERE username = ? AND status = 'active'`,
      [req.params.username]
    );
    if (!artist) return res.status(404).render('error', { message: 'Artista no encontrado', title: '404 | SimplyOver' });

    // Overlays del artista
    const overlays = await dbQuery(
      `SELECT o.id, o.name, o.slug, o.price, o.preview_storage_ids, o.tags,
              ROUND(AVG(r.rating),1) AS avg_rating, COUNT(DISTINCT r.id) AS review_count,
              COUNT(DISTINCT f.user_id) AS favorite_count
       FROM overlays o
       LEFT JOIN reviews r ON r.overlay_id = o.id
       LEFT JOIN favorites f ON f.overlay_id = o.id
       WHERE o.creator_id = ? AND o.status = 'APPROVED'
       GROUP BY o.id
       ORDER BY o.published_at DESC`,
      [artist.id]
    );

    // Conteo de seguidores
    const followersRow = await queryOne(
      'SELECT COUNT(*) AS cnt FROM user_follows WHERE following_id = ?', [artist.id]
    );
    const followingRow = await queryOne(
      'SELECT COUNT(*) AS cnt FROM user_follows WHERE follower_id = ?', [artist.id]
    );

    // Estado de follow del usuario actual
    let isFollowing = false;
    if (req.user && req.user.id !== artist.id) {
      const followCheck = await queryOne(
        'SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ? LIMIT 1',
        [req.user.id, artist.id]
      );
      isFollowing = followCheck !== null;
    }

    // Tags del artista
    let artistTags = [];
    try { artistTags = JSON.parse(artist.artist_tags || '[]'); } catch(e) {}

    res.render('artist_profile', {
      title: `${artist.display_name || artist.username} | SimplyOver`,
      artist: { ...artist, artist_tags_arr: artistTags },
      overlays,
      followers: followersRow?.cnt || 0,
      following: followingRow?.cnt || 0,
      isFollowing,
      isOwnProfile: req.user?.id === artist.id,
      spiderwebUrl: process.env.SPIDERWEBURL || '',
    });
  } catch (err) {
    console.error('[Artist Profile]', err);
    res.render('artist_profile', {
      title: 'Artist Profile | SimplyOver',
      artist: null, overlays: [], followers: 0, following: 0,
      isFollowing: false, isOwnProfile: false,
      spiderwebUrl: process.env.SPIDERWEBURL || '',
    });
  }
});

app.get('/overlay/:slug', async (req, res) => {
  try {
    const overlay = await queryOne(
      `SELECT o.*, u.username AS creator_username, u.display_name AS creator_display_name,
              u.avatar_storage_id AS creator_avatar, u.id AS creator_id_val
       FROM overlays o
       JOIN users u ON u.id = o.creator_id
       WHERE o.slug = ? AND o.status = 'APPROVED'`,
      [req.params.slug]
    );

    if (!overlay) {
      return res.status(404).render('error', { title: '404 | SimplyOver', message: 'Overlay no encontrado' });
    }

    // Reviews reales
    const reviews = await dbQuery(
      `SELECT r.id, r.rating, r.title, r.body, r.created_at,
              u.username, u.display_name, u.avatar_storage_id
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.overlay_id = ?
       ORDER BY r.created_at DESC LIMIT 20`,
      [overlay.id]
    );

    // Categorías del overlay
    const overlayCategories = await dbQuery(
      `SELECT c.name, c.slug FROM overlay_categories oc
       JOIN categories c ON c.id = oc.category_id
       WHERE oc.overlay_id = ?`,
      [overlay.id]
    );

    // Estado de favorito del usuario actual
    let isFavorite = false;
    let userPurchase = null;
    if (req.user) {
      const fav = await queryOne(
        'SELECT 1 FROM favorites WHERE user_id = ? AND overlay_id = ? LIMIT 1',
        [req.user.id, overlay.id]
      );
      isFavorite = !!fav;

      userPurchase = await queryOne(
        `SELECT id, download_token, download_count, download_limit, status
         FROM purchases WHERE buyer_id = ? AND overlay_id = ? AND status = 'COMPLETED' LIMIT 1`,
        [req.user.id, overlay.id]
      );
    }

    // Incrementar view_count
    await dbQuery('UPDATE overlays SET view_count = view_count + 1 WHERE id = ?', [overlay.id]);

    // Parsear preview_storage_ids
    let previewIds = [];
    try { previewIds = JSON.parse(overlay.preview_storage_ids || '[]'); } catch(e) {}

    // Parsear tags
    let tags = [];
    try { tags = JSON.parse(overlay.tags || '[]'); } catch(e) {}

    res.render('overlay_details', {
      title: `${overlay.name} | SimplyOver`,
      overlay: { ...overlay, previewIds, tags },
      reviews,
      overlayCategories,
      isFavorite,
      userPurchase,
      spiderwebUrl: process.env.SPIDERWEBURL || '',
    });
  } catch (err) {
    console.error('[Overlay Details]', err);
    res.status(500).render('error', { title: 'Error | SimplyOver', message: 'Error cargando el overlay.' });
  }
});

// ── API: Búsqueda de usuarios ─────────────────────────────────
app.get('/api/users/search', optionalAuth, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json({ users: [] });
  try {
    const users = await dbQuery(
      `SELECT username, display_name, avatar_storage_id FROM users
       WHERE (username LIKE ? OR display_name LIKE ?) AND status = 'active'
       ORDER BY username ASC LIMIT 10`,
      [`%${q.trim()}%`, `%${q.trim()}%`]
    );
    res.json({ users });
  } catch (err) {
    res.json({ users: [] });
  }
});

// ── API: Adquirir overlay gratuito (redirect a download) ──────
app.post('/api/purchase/free', async (req, res) => {
  // Delegado a downloadRouter
  res.redirect(307, '/download/purchase/free');
});



// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', { title: '404 | SimplyOver', message: 'Página no encontrada' });
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).render('error', { title: 'Error | SimplyOver', message: 'Error interno del servidor' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ SimplyOver corriendo en http://localhost:${PORT}`);
});
