import { query, queryOne, generateUUID } from './lib/db.js';

async function seed() {
  try {
    console.log('[Seed] Iniciando creación de overlays de prueba...');

    // Asegurar que hay al menos un usuario
    let user = await queryOne('SELECT id FROM users LIMIT 1');
    if (!user) {
        const userId = generateUUID();
        await query(`INSERT INTO users (id, username, email, display_name, role) VALUES (?, 'testcreator', 'test@example.com', 'Test Creator', 'user')`, [userId]);
        user = { id: userId };
    }

    // Asegurar que hay categorías
    const categories = await query('SELECT id FROM categories');
    let category1 = categories.length > 0 ? categories[0].id : null;
    let category2 = categories.length > 1 ? categories[1].id : category1;

    if (!category1) {
        category1 = generateUUID();
        category2 = generateUUID();
        await query(`INSERT INTO categories (id, name, slug) VALUES (?, 'Gaming', 'gaming')`, [category1]);
        await query(`INSERT INTO categories (id, name, slug) VALUES (?, 'Minimalist', 'minimalist')`, [category2]);
    }

    // Datos falsos
    const overlays = [
      {
        name: "Pro Streamer Neon Pack",
        slug: "pro-streamer-neon-pack-test",
        desc: "Un paquete completo con colores de neon, ideal para juegos FPS y de ritmo rápido.",
        price: 15.99,
        tags: ["neon", "gaming", "fps", "animated"],
        category_id: category1,
        // IDs reales de SpiderWeb de tus imágenes de la plataforma de prueba (usaremos la que está quemada en EJS)
        preview: "18", // Dummy o ID 18 de storage (usualmente es 18 en tu env SPIDERWEBCLOUDSTORAGEID)
      },
      {
        name: "Clean Minimalist Chat",
        slug: "clean-minimalist-chat-test",
        desc: "Un diseño limpio para Just Chatting. Sin distracciones, solo vos y tu chat.",
        price: 0.00,
        tags: ["clean", "minimalist", "chatting", "free"],
        category_id: category2,
        preview: "18",
      },
      {
        name: "Dark Retro 80s",
        slug: "dark-retro-80s-test",
        desc: "Vuelve a los 80s con este paquete retro. Efecto VHS incluido.",
        price: 4.99,
        tags: ["retro", "80s", "vhs", "dark"],
        category_id: category1,
        preview: "18",
      }
    ];

    for (const ov of overlays) {
      const id = generateUUID();
      
      // Borrar si ya existe (para poder re-ejecutar)
      await query(`DELETE FROM overlays WHERE slug = ?`, [ov.slug]);

      await query(
        `INSERT INTO overlays (id, creator_id, name, slug, description, price, zip_storage_id, preview_storage_ids, tags, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', NOW())`,
        [id, user.id, ov.name, ov.slug, ov.desc, ov.price, "18", JSON.stringify([ov.preview]), JSON.stringify(ov.tags)]
      );

      await query(
        `INSERT INTO overlay_categories (overlay_id, category_id) VALUES (?, ?)`,
        [id, ov.category_id]
      );
      
      console.log(`[Seed] Overlay creado: ${ov.name}`);
    }

    console.log('[Seed] Simulación completada exitosamente.');
  } catch (err) {
    console.error('[Seed] Error:', err);
  } finally {
    process.exit(0);
  }
}

seed();
