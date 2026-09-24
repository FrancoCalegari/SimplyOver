/**
 * seed_test_overlays.js
 * Crea overlays de prueba para todas las categorías del sistema.
 * Ejecutar: node seed_test_overlays.js
 * 
 * Requiere: un usuario con rol 'creator' o 'admin' ya existente en la DB.
 * Por defecto usa el primer admin encontrado como creador.
 */

import { query, queryOne, generateUUID } from './lib/db.js';
import dotenv from 'dotenv';
dotenv.config();

const OVERLAYS_PER_CATEGORY = 3;

const testOverlays = [
  // stream-alerts
  { name: 'Neon Pulse Alert Pack', cat: 'stream-alerts', price: 0, desc: 'Vibrant neon alert animations for subs, follows, and donations. Easy OBS Browser Source setup.', tags: ['neon', 'alerts', 'animated', 'obs'], resolution: '1920x1080' },
  { name: 'Cyberpunk Alert Suite', cat: 'stream-alerts', price: 499, desc: 'Futuristic cyberpunk-themed alerts with glitch effects and holographic UI elements.', tags: ['cyberpunk', 'alerts', 'glitch', 'premium'], resolution: '1920x1080' },
  { name: 'Minimal Alerts Collection', cat: 'stream-alerts', price: 0, desc: 'Clean, minimal alert animations. Perfect for professional streamers.', tags: ['minimal', 'alerts', 'clean'], resolution: '1920x1080' },

  // facecam-frames
  { name: 'Anime Facecam Frame Pack', cat: 'facecam-frames', price: 0, desc: 'Cute anime-style webcam frames with animated borders. Multiple variants included.', tags: ['anime', 'facecam', 'kawaii', 'free'], resolution: '1920x1080' },
  { name: 'Pro Streamer Facecam Kit', cat: 'facecam-frames', price: 299, desc: 'Professional facecam frames used by top streamers. Includes 8 unique designs.', tags: ['professional', 'facecam', 'premium'], resolution: '1920x1080' },
  { name: 'Dark Fantasy Frame Set', cat: 'facecam-frames', price: 199, desc: 'Dark, moody fantasy-themed facecam frames with particle effects.', tags: ['dark', 'fantasy', 'facecam'], resolution: '1920x1080' },

  // panels
  { name: 'Stream Panel Bundle - Minimal', cat: 'panels', price: 0, desc: '10 minimal stream panels including About, Schedule, Donate, Discord, and more.', tags: ['panels', 'minimal', 'bundle', 'free'], resolution: '320x100' },
  { name: 'Esports Panel Pack Pro', cat: 'panels', price: 399, desc: 'Premium esports-style panels with glowing accents. Fully editable PSD files included.', tags: ['esports', 'panels', 'premium', 'psd'], resolution: '320x100' },
  { name: 'Cozy Streamer Panels', cat: 'panels', price: 0, desc: 'Warm, cozy aesthetic panels perfect for variety streamers.', tags: ['cozy', 'panels', 'aesthetic', 'free'], resolution: '320x100' },

  // overlays-full
  { name: 'Complete Gaming Overlay Bundle', cat: 'overlays-full', price: 999, desc: 'Full streaming overlay suite: alerts, facecam frame, panels, stingers, and screens. OBS scene collection included.', tags: ['bundle', 'complete', 'gaming', 'obs'], resolution: '1920x1080' },
  { name: 'Lo-Fi Streaming Pack', cat: 'overlays-full', price: 599, desc: 'Complete lo-fi aesthetic overlay pack with animated rain, coffee, and chill vibes.', tags: ['lofi', 'complete', 'animated', 'chill'], resolution: '1920x1080' },
  { name: 'Vtuber Full Overlay Set', cat: 'overlays-full', price: 0, desc: 'Free full overlay set designed for Vtubers and anime content creators.', tags: ['vtuber', 'anime', 'complete', 'free'], resolution: '1920x1080' },

  // widgets
  { name: 'Animated Chat Box Widget', cat: 'widgets', price: 0, desc: 'Beautiful animated chat box widget. Works with Streamlabs and StreamElements.', tags: ['chat', 'widget', 'animated', 'free'], resolution: '400x600' },
  { name: 'Stream Timer & Clock Pack', cat: 'widgets', price: 149, desc: 'Customizable stream timer and digital clock widgets with multiple styles.', tags: ['timer', 'clock', 'widget', 'utility'], resolution: '300x100' },
  { name: 'Goal & Progress Bar Widget', cat: 'widgets', price: 99, desc: 'Animated goal and follower progress bar widgets. Perfect for challenges.', tags: ['goal', 'progress', 'widget', 'interactive'], resolution: '500x80' },

  // transitions
  { name: 'Glitch Stinger Pack', cat: 'transitions', price: 299, desc: '5 unique glitch-effect scene transition stingers. WebM format for OBS compatibility.', tags: ['glitch', 'stinger', 'transition', 'webm'], resolution: '1920x1080' },
  { name: 'Smooth Fade Transitions', cat: 'transitions', price: 0, desc: '8 smooth fade transition effects. Free for commercial streaming use.', tags: ['fade', 'smooth', 'transition', 'free'], resolution: '1920x1080' },
  { name: 'Particle Burst Stingers', cat: 'transitions', price: 199, desc: 'Dynamic particle explosion scene transitions with multiple color variants.', tags: ['particle', 'burst', 'transition', 'animated'], resolution: '1920x1080' },

  // screens
  { name: 'Be Right Back Screens Pack', cat: 'screens', price: 0, desc: '5 animated BRB screens with different aesthetics: minimal, gaming, cozy, anime, and retro.', tags: ['brb', 'screens', 'animated', 'free'], resolution: '1920x1080' },
  { name: 'Starting Soon Screen Bundle', cat: 'screens', price: 249, desc: 'Professional starting soon screens with countdown timer and animated backgrounds.', tags: ['starting', 'countdown', 'screens', 'premium'], resolution: '1920x1080' },
  { name: 'Offline Stream Screen Set', cat: 'screens', price: 0, desc: 'Beautiful offline screens with social media links placeholder. Free for all.', tags: ['offline', 'screens', 'social', 'free'], resolution: '1920x1080' },

  // bundles
  { name: 'Ultimate Streamer Bundle 2026', cat: 'bundles', price: 1499, desc: 'The most comprehensive streaming bundle: 200+ assets including alerts, panels, screens, frames, widgets, and transitions.', tags: ['ultimate', 'bundle', 'complete', 'value', '200+assets'], resolution: '1920x1080' },
  { name: 'Anime Creator Bundle', cat: 'bundles', price: 799, desc: 'Everything an anime-focused streamer needs: alerts, frames, panels, and matching screens in 3 color themes.', tags: ['anime', 'bundle', 'creator', 'themed'], resolution: '1920x1080' },
  { name: 'Free Starter Bundle', cat: 'bundles', price: 0, desc: 'Perfect for new streamers: 5 alerts, 3 panels, 1 BRB screen, 1 offline screen. All free!', tags: ['starter', 'bundle', 'free', 'beginner'], resolution: '1920x1080' },
];

async function seed() {
  try {
    console.log('🌱 Starting overlay seed...');

    // Buscar admin/creator para usarlo como creador
    const creator = await queryOne(
      `SELECT id, username FROM users WHERE role IN ('admin', 'creator') ORDER BY created_at ASC LIMIT 1`
    );

    if (!creator) {
      console.error('❌ No admin or creator user found. Create one first.');
      process.exit(1);
    }

    console.log(`👤 Using creator: @${creator.username} (${creator.id})`);

    // Cargar categorías
    const categories = await query('SELECT id, slug FROM categories', []);
    const catMap = {};
    categories.forEach(c => catMap[c.slug] = c.id);
    console.log('📂 Categories loaded:', Object.keys(catMap).join(', '));

    let created = 0;
    let skipped = 0;

    for (const ov of testOverlays) {
      const catId = catMap[ov.cat];
      if (!catId) {
        console.warn(`⚠️  Category not found: ${ov.cat} — skipping "${ov.name}"`);
        skipped++;
        continue;
      }

      // Generar slug único
      let slug = ov.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const existing = await queryOne('SELECT id FROM overlays WHERE slug = ?', [slug]);
      if (existing) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      const overlayId = generateUUID();
      const tagsJson = JSON.stringify(ov.tags || []);

      // Insertar overlay
      await query(
        `INSERT INTO overlays (id, creator_id, name, slug, description, short_description, price, currency,
           tags, status, resolution, view_count, download_count, is_featured, created_at, updated_at, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ARS', ?, 'APPROVED', ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [
          overlayId, creator.id, ov.name, slug, ov.desc,
          ov.desc.substring(0, 100) + (ov.desc.length > 100 ? '...' : ''),
          ov.price, tagsJson, ov.resolution || '1920x1080',
          Math.floor(Math.random() * 500), Math.floor(Math.random() * 200),
          ov.price === 0 && Math.random() > 0.7 ? 1 : 0
        ]
      );

      // Asignar categoría
      await query(
        'INSERT IGNORE INTO overlay_categories (overlay_id, category_id) VALUES (?, ?)',
        [overlayId, catId]
      );

      console.log(`  ✅ Created: "${ov.name}" (${ov.cat}) — $${ov.price}`);
      created++;
    }

    console.log(`\n🎉 Seed complete! Created: ${created}, Skipped: ${skipped}`);
    console.log(`📊 Total overlays in DB: ${(await queryOne('SELECT COUNT(*) AS cnt FROM overlays WHERE status = "APPROVED"')).cnt}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
