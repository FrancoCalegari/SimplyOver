/**
 * routes/ai.js
 * IA Chat flotante + Generador de plantillas con IA (SimplyOver AI).
 */

import { Router } from 'express'
import { optionalAuth, requireAuth } from '../lib/authExpress.js'
import { query, queryOne, generateUUID } from '../lib/db.js'
import { spiderWeb } from '../lib/SpiderWebService.js'
import { getAIChatReply, getAITemplateGeneration } from '../lib/aiService.js'

const router = Router()

// ─── POST /api/ai-chat ────────────────────────────────────────────────────────
// Chat flotante asistente del marketplace
router.post('/ai-chat', optionalAuth, async (req, res) => {
  const isDebug = process.env.DEBUG_MODE === 'true';
  const { message, history = [] } = req.body
  if (!message?.trim()) return res.status(400).json({ error: 'Missing message' })

  // ── Respuestas Estáticas (Rendimiento / Reducir tokens IA) ──
  const lowerMsg = message.trim().toLowerCase();
  if (lowerMsg === 'overlays gratuitos') {
    let carousel = [];
    try {
      const freeOverlays = await query(`
        SELECT o.name, o.slug, o.price, o.cover_storage_id
        FROM overlays o
        WHERE o.status = 'APPROVED' AND o.price = 0
        ORDER BY RAND() LIMIT 4
      `);
      carousel = freeOverlays.map(o => ({
        name: o.name,
        url: `/overlay/${o.slug}`,
        image: o.cover_storage_id ? `/api/v1/storage/files/${o.cover_storage_id}` : 'https://via.placeholder.com/300x169/1f1f26/d2bbff?text=No+Image',
        price: 'Gratis'
      }));
    } catch(e) { console.error('Error fetching free overlays carousel:', e.message); }
    return res.json({ 
      reply: '¡Por supuesto! Tenemos muchos **overlays gratuitos** en la plataforma. Aquí tienes algunas opciones populares para bajarlos al instante:',
      carousel 
    });
  }
  
  if (lowerMsg === 'estilo cyberpunk') {
    let carousel = [];
    try {
      const cyberOverlays = await query(`
        SELECT o.name, o.slug, o.price, o.cover_storage_id
        FROM overlays o
        WHERE o.status = 'APPROVED' 
          AND (LOWER(o.name) LIKE '%cyberpunk%' OR LOWER(o.description) LIKE '%cyberpunk%' OR LOWER(o.tags) LIKE '%cyberpunk%')
        ORDER BY RAND() LIMIT 4
      `);
      carousel = cyberOverlays.map(o => ({
        name: o.name,
        url: `/overlay/${o.slug}`,
        image: o.cover_storage_id ? `/api/v1/storage/files/${o.cover_storage_id}` : 'https://via.placeholder.com/300x169/1f1f26/d2bbff?text=No+Image',
        price: o.price > 0 ? `$${o.price}` : 'Gratis'
      }));
    } catch(e) { console.error('Error fetching cyberpunk overlays carousel:', e.message); }
    return res.json({ 
      reply: '¡El **estilo Cyberpunk** es genial! ⚡ Aquí tienes algunos de los mejores overlays futuristas y de neón que han publicado nuestros creadores:',
      carousel
    });
  }
  if (lowerMsg.includes('cómo funciona') || lowerMsg.includes('como funciona')) {
    return res.json({ reply: 'SimplyOver es el marketplace para streamers. Puedes **descargar overlays**, **publicar tus creaciones** [BTN:PUBLISH], **editar en la web** [BTN:WEB_EDITOR] o **generarlos con Inteligencia Artificial** [BTN:AI_STUDIO]. ¿Qué te gustaría hacer?' });
  }
  if (lowerMsg.includes('crear con ia') || lowerMsg.includes('generar con ia')) {
    return res.json({ reply: '¡Claro! Puedes crear overlays únicos y personalizados en nuestro AI Studio. Simplemente describe tu idea y la Inteligencia Artificial generará el diseño por ti. [BTN:AI_STUDIO]' });
  }

  let systemPrompt = `Eres el asistente virtual de SimplyOver, el marketplace de overlays para OBS y streaming.
Tu rol es actuar como asistente de soporte, analista de contenido y guía de la plataforma.

Funciones disponibles:
- Ayuda a encontrar overlays por categoría (stream-alerts, facecam-frames, panels, widgets, bundles, transitions, screens, etc.)
- Explica el sistema de favoritos (corazón en cada overlay), tableros (guardar en boards), y biblioteca (overlays descargados)
- Guia sobre cómo publicar overlays: ir a Studio, subir preview + archivo ZIP, elegir categoría y precio
- Explica el AI Studio: describe tu overlay y la IA genera una especificación completa lista para usar
- Sistema de mensajes: podés contactar directamente a los creadores desde su perfil
- Overlays gratuitos: se descargan directamente; overlays de pago: requieren compra

Formato de respuesta:
- Usas Markdown con **negrita** para conceptos importantes e *cursiva* para ejemplos
- Sos amigable y orientado a ayudar streamers a mejorar su contenido visual
- **Responde de forma CORTA Y CONCISA** para reducir el número de tokens y dar una respuesta rápida
- Si el usuario busca algo específico, sugerir navegar por categorías o usar el buscador del sitio`;

  if (req.user) {
    try {
      const latestOverlays = await query(`
        SELECT name, slug, price, short_description 
        FROM overlays 
        WHERE status = 'APPROVED' 
        ORDER BY published_at DESC LIMIT 10
      `);
      const overlayContext = latestOverlays.map(o => `- **${o.name}** (Precio: ${o.price > 0 ? '$'+o.price : 'Gratis'}): ${o.short_description || ''} -> Enlace: /overlay/${o.slug}`).join('\n');

      systemPrompt += `\n\nCOMO USUARIO REGISTRADO:
1. Puedes recomendar de la siguiente lista de overlays recientes en la plataforma:\n${overlayContext}
2. Cuando el usuario te pregunte cómo "crear un overlay", "hacer un overlay", o sobre el "editor web", SIEMPRE incluye el tag [BTN:WEB_EDITOR] en tu respuesta para que puedan abrirlo.
3. Cuando el usuario pregunte cómo "publicar", "subir un proyecto" o vender un overlay, SIEMPRE incluye el tag [BTN:PUBLISH] en tu respuesta.
4. Cuando el usuario pregunte cómo "generar con IA" o sobre "AI Studio", SIEMPRE incluye el tag [BTN:AI_STUDIO] en tu respuesta.
IMPORTANTE: Usa los tags exactamente así (ej. [BTN:PUBLISH], [BTN:WEB_EDITOR]), el sistema los convertirá en botones clickeables.`;
    } catch (e) {
      console.warn('[AI/Chat] Could not load context', e.message);
    }
  }


  try {
    let fallbackModelId = 1;
    try {
      const settingRow = await queryOne(`SELECT setting_value FROM site_settings WHERE setting_key = 'ai_model_id'`);
      const adminModelId = settingRow ? JSON.parse(settingRow.setting_value) : null;
      if (adminModelId) fallbackModelId = Number(adminModelId);
    } catch {}

    const { reply } = await getAIChatReply({
      message,
      history,
      systemPrompt,
      fallbackModelId,
    });

    // Guardar sesión si hay usuario autenticado
    if (req.user) {
      const sessionId = generateUUID();
      try {
        const sessionHistory = [
          ...history.slice(-10),
          { role: 'user', content: message },
          { role: 'assistant', content: reply }
        ];
        await query(
          `INSERT INTO ia_sessions (id, user_id, model_id, messages, created_at, updated_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [sessionId, req.user.id, 'simplyover-ai', JSON.stringify(sessionHistory)]
        );
      } catch (saveErr) {
        console.warn('[AI/Chat] Could not save session:', saveErr.message);
      }
    }

    res.json({ reply });
  } catch (err) {
    console.warn('[AI/Chat] Error general:', err.message);
    res.json({
      reply: '¡Hola! Soy tu asistente de SimplyOver. ¿En qué puedo ayudarte a mejorar tu stream hoy?',
      fallback: true
    });
  }
})

// ─── GET /studio/ai ───────────────────────────────────────────────────────────
// Vista del generador de plantillas con IA
router.get('/studio/ai', requireAuth, async (req, res) => {
  res.render('ai_studio', {
    title: 'AI Template Generator | SimplyOver',
  })
})

// ─── POST /api/ai-generate ────────────────────────────────────────────────────
// Generador de plantillas / overlays con IA
router.post('/ai-generate', requireAuth, async (req, res) => {
  const isDebug = process.env.DEBUG_MODE === 'true';
  const { prompt, style = 'cyberpunk', colors = [], format = '1920x1080' } = req.body
  if (!prompt?.trim()) return res.status(400).json({ error: 'Missing prompt' })

  const systemPrompt = `Eres un diseñador experto en overlays para streaming OBS. 
Cuando el usuario te dé una descripción, debes:
1. Generar una descripción técnica detallada del overlay (qué elementos incluir, dónde posicionarlos)
2. Proponer un esquema de colores específico en formato HEX
3. Sugerir tipografías de Google Fonts adecuadas
4. Describir animaciones y efectos recomendados
5. Listar los componentes necesarios (alertbox, webcam frame, panels, etc.)
Responde en JSON con la estructura: { title, description, colorScheme: { primary, secondary, accent, background }, fonts: [], elements: [], animations: [], suggestedCategories: [] }`

  try {
    let fallbackModelId = 1;
    try {
      const settingRow = await queryOne(`SELECT setting_value FROM site_settings WHERE setting_key = 'ai_model_id'`);
      const adminModelId = settingRow ? JSON.parse(settingRow.setting_value) : null;
      if (adminModelId) fallbackModelId = Number(adminModelId);
    } catch {}

    const parsed = await getAITemplateGeneration({
      prompt,
      style,
      colors,
      format,
      systemPrompt,
      fallbackModelId,
    });

    // Guardar el draft en canvas_drafts
    const draftId = generateUUID();
    await query(
      `INSERT INTO canvas_drafts (id, creator_id, name, canvas_data, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'DRAFT', NOW(), NOW())`,
      [draftId, req.user.id, parsed.title || 'AI Generated Overlay', JSON.stringify(parsed)]
    );

    res.json({ success: true, draftId, template: parsed });
  } catch (err) {
    console.error('[AI/Generate] Error:', err.message);
    res.status(500).json({ error: 'Generation failed. Please try again.' });
  }
})

export default router
