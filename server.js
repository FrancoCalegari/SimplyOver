import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

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

// ── Routers modulares ─────────────────────────────────────────
import authRouter      from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import libraryRouter   from './routes/library.js';
import boardsRouter    from './routes/boards.js';
import messagesRouter  from './routes/messages.js';
import aiRouter        from './routes/ai.js';
import favoritesRouter from './routes/favorites.js';

app.use('/auth',        authRouter);
app.use('/category',    categoriesRouter);
app.use('/dashboard/library', libraryRouter);
app.use('/boards',      boardsRouter);
app.use('/messages',    messagesRouter);
app.use('/api',         aiRouter);
app.use('/api/favorites', favoritesRouter);

// /studio/ai handled by aiRouter's GET /studio/ai route
app.get('/studio/ai', async (req, res, next) => {
  if (!req.user) return res.redirect('/login?error=session_required');
  res.render('ai_studio', { title: 'AI Studio | SimplyOver' });
});

// ── Frontend Routes ───────────────────────────────────────────
app.get('/', (req, res) => {
  res.render('index', { title: 'SimplyOver | High-Performance OBS Overlay Marketplace' });
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
  const { query: dbQuery, queryOne } = await import('./lib/db.js');
  try {
    const user = await queryOne(
      `SELECT id, username, display_name, bio, avatar_storage_id, banner_storage_id,
              link_twitch, link_instagram, link_tiktok, link_kick, link_web,
              created_at, role
       FROM users WHERE username = ? AND status = 'active'`,
      [req.params.username]
    );
    if (!user) return res.status(404).render('error', { message: 'Artista no encontrado', title: '404' });

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
      [user.id]
    );

    res.render('artist_profile', {
      title: `${user.display_name || user.username} | SimplyOver`,
      artist: user,
      overlays,
    });
  } catch (err) {
    console.error('[Artist Profile]', err);
    res.render('artist_profile', {
      title: 'Artist Profile | SimplyOver',
      artist: null,
      overlays: [],
    });
  }
});

app.get('/overlay/:id', async (req, res) => {
  res.render('overlay_details', { title: 'Overlay Details | SimplyOver' });
});

app.get('/studio', (req, res) => {
  res.render('studio_canvas', { title: 'Studio Canvas | SimplyOver' });
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
