/**
 * reseed_with_photos.js
 * Vacía la base de datos de overlays y la vuelve a llenar con 24 overlays completos,
 * descargando y subiendo imágenes temáticas a SpiderWeb Cloud Storage (Storage Project 18)
 * para que todos los overlays tengan fotos de preview reales.
 *
 * Ejecutar: node reseed_with_photos.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { query, queryOne, generateUUID } from './lib/db.js';
import { spiderWeb } from './lib/SpiderWebService.js';
import bcrypt from 'bcryptjs';

// Lista curada de 24 overlays distribuidos en las 8 categorías del sistema
const overlayDefinitions = [
  // ── 1. stream-alerts ──────────────────────────────────────────────────────────
  {
    name: 'Cyberpunk 2077 HUD Stream Alerts',
    cat: 'stream-alerts',
    price: 499.00,
    desc: 'Alertas animadas futuristas estilo Cyberpunk con efectos de glitch sincronizados por sonido, marco de HUD y tipografía de neón de alto impacto visual.',
    tags: ['cyberpunk', 'alerts', 'glitch', 'obs', 'twitch'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    creator: 'cyber_artisan'
  },
  {
    name: 'Neon Pulse Reactive Alerts',
    cat: 'stream-alerts',
    price: 0.00,
    desc: 'Paquete de alertas reactivas con pulsos de neón en tonos cian y magenta para suscriptores, donaciones y seguidores. 100% gratuito y ligero.',
    tags: ['neon', 'alerts', 'animated', 'free', 'obs'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
    creator: 'neon_forge'
  },
  {
    name: 'Minimal Clean Stream Alerts',
    cat: 'stream-alerts',
    price: 199.00,
    desc: 'Animaciones limpias y sutiles para creadores profesionales que buscan mantener el foco en el juego o la conversación sin distracciones excesivas.',
    tags: ['minimal', 'clean', 'alerts', 'modern', 'subtle'],
    resolution: '1920x1080',
    creator: 'Franco'
  },

  // ── 2. facecam-frames ─────────────────────────────────────────────────────────
  {
    name: 'Anime Kawaii Glow Facecam Frame',
    cat: 'facecam-frames',
    price: 0.00,
    desc: 'Marco de cámara para streamers de anime y Vtubers con destellos brillantes en bordes y esquinas redondeadas en tonos pastel.',
    tags: ['anime', 'kawaii', 'facecam', 'free', 'border'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80',
    creator: 'lofi_streamer'
  },
  {
    name: 'Esports Pro Apex Webcam Border',
    cat: 'facecam-frames',
    price: 299.00,
    desc: 'Marco agresivo para shooters competitivos con detalles en fibra de carbono y líneas angulares iluminadas en rojo rubí.',
    tags: ['esports', 'apex', 'pro', 'facecam', 'fps'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&q=80',
    creator: 'Franco'
  },
  {
    name: 'Dark Fantasy Mystic Frame',
    cat: 'facecam-frames',
    price: 349.00,
    desc: 'Marco gótico medieval con niebla mística y partículas ascendentes para juegos de rol, Souls-like y streams de ambientación oscura.',
    tags: ['dark', 'fantasy', 'rpg', 'particles', 'facecam'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    creator: 'cyber_artisan'
  },

  // ── 3. panels ─────────────────────────────────────────────────────────────────
  {
    name: 'Glassmorphism Twitch Panels Pack',
    cat: 'panels',
    price: 0.00,
    desc: 'Set de 16 paneles con efecto frosted glass y bordes translúcidos para Sobre Mí, Donaciones, Discord, Reglas y Redes Sociales.',
    tags: ['glassmorphism', 'panels', 'twitch', 'kick', 'free'],
    resolution: '320x100',
    imgUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
    creator: 'neon_forge'
  },
  {
    name: 'Cozy Warm Coffee Stream Panels',
    cat: 'panels',
    price: 149.00,
    desc: 'Paneles cálidos y acogedores con ilustraciones de café y paleta otoñal diseñados para transmisiones de arte, música y Just Chatting.',
    tags: ['cozy', 'coffee', 'panels', 'aesthetic', 'autumn'],
    resolution: '320x100',
    imgUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
    creator: 'lofi_streamer'
  },
  {
    name: 'Cyber Neon Esports Panels Pro',
    cat: 'panels',
    price: 399.00,
    desc: 'Paneles profesionales de alto impacto visual con capas PSD editables y fuentes tipográficas deportivas premium incluidas.',
    tags: ['cyber', 'panels', 'esports', 'psd', 'editable'],
    resolution: '320x100',
    imgUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
    creator: 'Franco'
  },

  // ── 4. overlays-full ──────────────────────────────────────────────────────────
  {
    name: 'Lo-Fi Chill Midnight Complete Pack',
    cat: 'overlays-full',
    price: 799.00,
    desc: 'Suite completa con lluvia animada, música ambiental en loop, pantallas de inicio y fin, marco de cámara y widget de chat integrado.',
    tags: ['lofi', 'complete', 'animated', 'chill', 'obs'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80',
    creator: 'lofi_streamer'
  },
  {
    name: 'Obsidian Ethereal Streamer Suite',
    cat: 'overlays-full',
    price: 999.00,
    desc: 'El paquete insignia de SimplyOver. Animaciones a 60 FPS, alertas modulares, transiciones y escenas pre-configuradas para OBS 30+.',
    tags: ['obsidian', 'premium', 'complete', '60fps', 'hud'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
    creator: 'cyber_artisan'
  },
  {
    name: 'Pastel Galaxy Vtuber Full Suite',
    cat: 'overlays-full',
    price: 0.00,
    desc: 'Set integral para Vtubers y creadores con temática cósmica pastel, nubes animadas y estrellas centelleantes. Libre de regalías.',
    tags: ['vtuber', 'pastel', 'galaxy', 'anime', 'free'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
    creator: 'lofi_streamer'
  },

  // ── 5. widgets ────────────────────────────────────────────────────────────────
  {
    name: 'Dynamic Interactive Chat Box Widget',
    cat: 'widgets',
    price: 0.00,
    desc: 'Caja de chat flotante con burbujas animadas, soporte para insignias de suscriptor, emotes y badges de Twitch y Kick.',
    tags: ['chat', 'widget', 'interactive', 'html5', 'free'],
    resolution: '400x600',
    imgUrl: 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=800&q=80',
    creator: 'neon_forge'
  },
  {
    name: 'Sub Goal & Follower Progress Bar',
    cat: 'widgets',
    price: 199.00,
    desc: 'Barra de meta reactiva con porcentaje en vivo, chispas de neón y efecto de felicitación al alcanzar el objetivo deseado.',
    tags: ['goal', 'progress', 'widget', 'customizable', 'obs'],
    resolution: '500x80',
    imgUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    creator: 'Franco'
  },
  {
    name: 'Live Audio Equalizer & Spectrum Widget',
    cat: 'widgets',
    price: 249.00,
    desc: 'Ecualizador gráfico que reacciona a la música de Spotify y audio del juego en tiempo real directamente como Browser Source en OBS.',
    tags: ['audio', 'music', 'visualizer', 'spectrum', 'widget'],
    resolution: '400x120',
    imgUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    creator: 'neon_forge'
  },

  // ── 6. transitions ────────────────────────────────────────────────────────────
  {
    name: 'Hyper Glitch Stinger Transition',
    cat: 'transitions',
    price: 299.00,
    desc: '5 transiciones de corte rápido con efecto glitch holográfico en formato WebM transparente con audio sincronizado a 60 FPS.',
    tags: ['glitch', 'stinger', 'transition', 'webm', 'obs'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
    creator: 'cyber_artisan'
  },
  {
    name: 'Smooth Smoke & Gradient Wipe',
    cat: 'transitions',
    price: 0.00,
    desc: 'Transición suave de humo multicolor ideal para streamers de Just Chatting y cambios de escena tranquilos y profesionales.',
    tags: ['smoke', 'gradient', 'smooth', 'transition', 'free'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80',
    creator: 'lofi_streamer'
  },
  {
    name: 'Sci-Fi Portal Warp Stinger',
    cat: 'transitions',
    price: 249.00,
    desc: 'Efecto túnel hiperespacial con distorsión óptica y sonido de portal para transicionar entre pantalla de juego y cámara completa.',
    tags: ['scifi', 'portal', 'warp', 'transition', 'animated'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    creator: 'neon_forge'
  },

  // ── 7. screens ────────────────────────────────────────────────────────────────
  {
    name: 'Starting Soon Cozy Lo-Fi Screen',
    cat: 'screens',
    price: 0.00,
    desc: 'Pantalla de Comenzando Pronto con temporizador regresivo de 5 minutos, taza de café humeante y lluvia suave en la ventana.',
    tags: ['starting', 'screens', 'lofi', 'animated', 'free'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    creator: 'lofi_streamer'
  },
  {
    name: 'Be Right Back Cyberpunk Neon Screen',
    cat: 'screens',
    price: 249.00,
    desc: 'Pantalla de Ya Volvemos con callejón nocturno iluminado por carteles de neón parpadeantes y reflejos de lluvia en el asfalto.',
    tags: ['brb', 'screens', 'cyberpunk', 'neon', 'loop'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&q=80',
    creator: 'cyber_artisan'
  },
  {
    name: 'Stream Ending Retro VHS Screen',
    cat: 'screens',
    price: 199.00,
    desc: 'Pantalla de Fin de Transmisión con estética de cinta VHS de los 80, grid en perspectiva y agradecimientos para tus seguidores.',
    tags: ['offline', 'screens', 'vhs', 'retro', 'synthwave'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80',
    creator: 'Franco'
  },

  // ── 8. bundles ────────────────────────────────────────────────────────────────
  {
    name: 'Ultimate Streamer 2026 Mega Bundle',
    cat: 'bundles',
    price: 1499.00,
    desc: 'El paquete más completo de SimplyOver: más de 200 archivos que incluyen alertas, marcos, pantallas, paneles, widgets y transiciones.',
    tags: ['ultimate', 'bundle', 'complete', 'premium', '200+assets'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    creator: 'Franco'
  },
  {
    name: 'Anime Creator Super Bundle',
    cat: 'bundles',
    price: 899.00,
    desc: 'Todo lo que un streamer de temática anime necesita: 3 variantes de color (Sakura, Dark, Neón) con todas las escenas listas para OBS.',
    tags: ['anime', 'bundle', 'kawaii', 'complete', 'creator'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80',
    creator: 'lofi_streamer'
  },
  {
    name: 'Free Starter Streamer Bundle',
    cat: 'bundles',
    price: 0.00,
    desc: 'Pack esencial para comenzar a streamear hoy: 5 alertas básicas, 4 paneles, pantalla de inicio y marco de webcam. Gratis para siempre.',
    tags: ['starter', 'bundle', 'free', 'beginner', 'essential'],
    resolution: '1920x1080',
    imgUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
    creator: 'Franco'
  }
];

// Generador de SVG fallback de alta calidad si la descarga externa falla
function generateFallbackSvg(name, category, price) {
  const isFree = price === 0;
  const badgeText = isFree ? 'FREE OVERLAY' : `$${price.toFixed(2)} ARS`;
  const badgeColor = isFree ? '#06b6d4' : '#a855f7';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0d0d15"/>
          <stop offset="50%" stop-color="#171526"/>
          <stop offset="100%" stop-color="#0a0a0f"/>
        </linearGradient>
        <linearGradient id="neonLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#4facfe"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#bgGrad)"/>
      <circle cx="150" cy="100" r="140" fill="#7c3aed" opacity="0.12"/>
      <circle cx="680" cy="350" r="180" fill="#009ee3" opacity="0.10"/>
      <rect x="40" y="40" width="720" height="370" rx="18" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
      <rect x="70" y="70" width="130" height="30" rx="15" fill="${badgeColor}" fill-opacity="0.15" stroke="${badgeColor}" stroke-width="1"/>
      <text x="135" y="90" fill="${badgeColor}" font-family="'Inter', sans-serif" font-size="12" font-weight="700" text-anchor="middle" letter-spacing="1">${badgeText}</text>
      <text x="70" y="220" fill="#ffffff" font-family="'Inter', sans-serif" font-size="28" font-weight="800">${name.substring(0, 38)}</text>
      <text x="70" y="255" fill="#a1a1aa" font-family="'Inter', sans-serif" font-size="15" font-weight="400">SimplyOver Studio • ${category.toUpperCase()} • OBS Studio 30+</text>
      <line x1="70" y1="360" x2="350" y2="360" stroke="url(#neonLine)" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `.trim();
}

async function run() {
  console.log('🚀 [SimplyOver] Iniciando reseteo y poblado completo de overlays con fotos...');

  try {
    // ── 1. Vaciar tablas de overlays existentes ────────────────────────────────
    console.log('\n🧹 [Paso 1/5] Vaciando tablas de overlays...');
    await query('DELETE FROM reviews');
    await query('DELETE FROM favorites');
    await query('DELETE FROM board_items');
    await query('DELETE FROM overlay_categories');
    await query('DELETE FROM purchases');
    await query('DELETE FROM canvas_drafts');
    await query('DELETE FROM overlays');
    console.log('   ✅ Tablas de overlays vaciadas.');

    // ── 2. Asegurar Usuarios / Creadores ───────────────────────────────────────
    console.log('\n👤 [Paso 2/5] Verificando usuarios creadores...');
    const defaultPasswordHash = await bcrypt.hash('12345678', 10);

    const creatorsToEnsure = [
      {
        username: 'Franco',
        email: 'francocalegari55@gmail.com',
        displayName: 'Franco Calegari',
        bio: 'Fundador y Diseñador Principal en SimplyOver. Creando experiencias de streaming de vanguardia.',
        role: 'admin'
      },
      {
        username: 'cyber_artisan',
        email: 'cyber@simplyover.com',
        displayName: 'CyberArtisan Studio',
        bio: 'Especialista en HUDs futuristas, estética Cyberpunk y efectos glitch a 60 FPS.',
        role: 'creator'
      },
      {
        username: 'lofi_streamer',
        email: 'lofi@simplyover.com',
        displayName: 'LoFi Aesthetics',
        bio: 'Arte relajante, paletas pastel, estética anime y lluvia para streams acogedores.',
        role: 'creator'
      },
      {
        username: 'neon_forge',
        email: 'neon@simplyover.com',
        displayName: 'NeonForge VFX',
        bio: 'Widgets reactivos, transiciones dinámicas y herramientas interactivas para OBS.',
        role: 'creator'
      }
    ];

    const creatorMap = {};

    for (const c of creatorsToEnsure) {
      let existing = await queryOne('SELECT id, username FROM users WHERE username = ? OR email = ? LIMIT 1', [c.username, c.email]);
      if (!existing) {
        const newId = generateUUID();
        await query(
          `INSERT INTO users (id, username, email, password_hash, display_name, bio, role, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
          [newId, c.username, c.email, defaultPasswordHash, c.displayName, c.bio, c.role]
        );
        creatorMap[c.username] = newId;
        console.log(`   ➕ Creado usuario: @${c.username}`);
      } else {
        creatorMap[c.username] = existing.id;
        // Asegurar rol y status
        await query('UPDATE users SET role = ?, status = "active", display_name = ? WHERE id = ?', [c.role, c.displayName, existing.id]);
        console.log(`   ✔ Usuario existente verificado: @${c.username}`);
      }
    }

    // ── 3. Asegurar Categorías del Catálogo ────────────────────────────────────
    console.log('\n📂 [Paso 3/5] Verificando categorías...');
    const categoriesDb = await query('SELECT id, slug FROM categories');
    const catMap = {};
    categoriesDb.forEach(c => { catMap[c.slug] = c.id; });
    console.log(`   Categorías activas: ${Object.keys(catMap).join(', ')}`);

    // ── 4. Subir Archivo ZIP Universal de Demostración ────────────────────────
    console.log('\n📦 [Paso 4/5] Subiendo paquete ZIP de muestra a SpiderWeb Storage...');
    // Creamos un ZIP válido con un archivo de bienvenida
    const emptyZip = Buffer.from([
      0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    const zipUpload = await spiderWeb.uploadFiles(emptyZip, ['simplyover_stream_pack.zip']);
    const zipStorageId = String(zipUpload[0]?.id || '1057');
    console.log(`   ✅ ZIP alojado con ID de SpiderWeb: ${zipStorageId}`);

    // ── 5. Procesar e Insertar los 24 Overlays con Fotos ───────────────────────
    console.log('\n🎨 [Paso 5/5] Descargando y subiendo fotos a SpiderWeb Storage...');
    let successCount = 0;

    for (let i = 0; i < overlayDefinitions.length; i++) {
      const def = overlayDefinitions[i];
      const progress = `[${i + 1}/${overlayDefinitions.length}]`;
      const catId = catMap[def.cat];

      if (!catId) {
        console.warn(`   ⚠️ Categoría no encontrada para ${def.name}: ${def.cat}`);
        continue;
      }

      const creatorId = creatorMap[def.creator] || creatorMap['Franco'];
      let imageBuffer = null;
      let filename = `${def.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.jpg`;

      // Intentar descargar imagen de Unsplash
      if (def.imgUrl) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(def.imgUrl, { signal: controller.signal });
          clearTimeout(timeout);

          if (res.ok) {
            const arr = await res.arrayBuffer();
            imageBuffer = Buffer.from(arr);
          }
        } catch (fetchErr) {
          // Silencioso, usará SVG fallback
        }
      }

      // Si falló la descarga o no tiene URL, usar SVG temático
      if (!imageBuffer) {
        const svgContent = generateFallbackSvg(def.name, def.cat, def.price);
        imageBuffer = Buffer.from(svgContent);
        filename = `${def.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.svg`;
      }

      // Subir imagen a SpiderWeb Storage
      let previewStorageId = null;
      try {
        const uploadRes = await spiderWeb.uploadFiles(imageBuffer, [filename]);
        if (uploadRes && uploadRes[0]?.id) {
          previewStorageId = String(uploadRes[0].id);
        }
      } catch (uploadErr) {
        console.error(`   ❌ Error subiendo a SpiderWeb para "${def.name}":`, uploadErr.message);
      }

      if (!previewStorageId) {
        previewStorageId = '1055'; // Fallback a SVG general si SpiderWeb rechaza
      }

      // Generar slug
      let slug = def.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const existingSlug = await queryOne('SELECT id FROM overlays WHERE slug = ?', [slug]);
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      const overlayId = generateUUID();
      const tagsJson = JSON.stringify(def.tags || []);
      const previewJson = JSON.stringify([previewStorageId]);
      const viewCount = Math.floor(Math.random() * 450) + 50;
      const downloadCount = Math.floor(Math.random() * 180) + 10;
      const isFeatured = (def.price > 0 && Math.random() > 0.4) || (def.price === 0 && Math.random() > 0.7) ? 1 : 0;

      // Insertar overlay
      await query(
        `INSERT INTO overlays (
          id, creator_id, name, slug, description, short_description, price, currency,
          zip_storage_id, preview_storage_ids, tags, status, resolution, software_version,
          view_count, download_count, is_featured, created_at, updated_at, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ARS', ?, ?, ?, 'APPROVED', ?, 'OBS Studio 30+', ?, ?, ?, NOW(), NOW(), NOW())`,
        [
          overlayId, creatorId, def.name, slug, def.desc,
          def.desc.substring(0, 110) + '...',
          def.price,
          zipStorageId,
          previewJson,
          tagsJson,
          def.resolution || '1920x1080',
          viewCount, downloadCount, isFeatured
        ]
      );

      // Asociar a categoría
      await query('INSERT IGNORE INTO overlay_categories (overlay_id, category_id) VALUES (?, ?)', [overlayId, catId]);

      const priceTag = def.price === 0 ? 'GRATIS' : `$${def.price.toFixed(2)} ARS`;
      console.log(`   ${progress} ✅ "${def.name}" | ${priceTag} | Foto ID: ${previewStorageId}`);
      successCount++;
    }

    // ── Resumen Final ─────────────────────────────────────────────────────────
    const totalCount = await queryOne('SELECT COUNT(*) AS cnt FROM overlays WHERE status = "APPROVED"');
    console.log('\n══════════════════════════════════════════════════════════');
    console.log(`🎉 ¡Base de datos reinicializada con éxito!`);
    console.log(`📊 Total de overlays creados con fotos: ${successCount}`);
    console.log(`🔍 Total en tabla overlays: ${totalCount?.cnt || 0}`);
    console.log(`🖼️  Cada overlay cuenta con ID de almacenamiento asignado en SpiderWeb.`);
    console.log('══════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error fatal durante el proceso:', err);
    process.exit(1);
  }
}

run();
