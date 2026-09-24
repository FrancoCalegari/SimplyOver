/**
 * routes/ai.js
 * IA Chat flotante + Generador de plantillas con IA (SpiderIA).
 */

import { Router } from 'express'
import { optionalAuth, requireAuth } from '../lib/authExpress.js'
import { query, queryOne, generateUUID } from '../lib/db.js'
import { spiderWeb } from '../lib/SpiderWebService.js'

const router = Router()

// ─── POST /api/ai-chat ────────────────────────────────────────────────────────
// Chat flotante asistente del marketplace
router.post('/ai-chat', optionalAuth, async (req, res) => {
  const { message, history = [] } = req.body
  if (!message?.trim()) return res.status(400).json({ error: 'Missing message' })

  const systemPrompt = `Eres el asistente virtual de SimplyOver, el marketplace de overlays para OBS y streaming.
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
- Sos amigable, conciso y orientado a ayudar streamers a mejorar su contenido visual
- Si el usuario busca algo específico, sugerir navegar por categorías o usar el buscador del sitio`


  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10), // últimos 10 mensajes del historial
    { role: 'user', content: message }
  ]

  try {
    const modelsData = await spiderWeb.getIAModels()
    const fallbackModelId = modelsData?.models?.[0]?.id || 1

    const settingRow = await queryOne(`SELECT setting_value FROM site_settings WHERE setting_key = 'ai_model_id'`);
    const adminModelId = settingRow ? JSON.parse(settingRow.setting_value) : null;
    const modelId = adminModelId || fallbackModelId;

    const result = await spiderWeb.iaChat(modelId, messages)
    const reply = result?.choices?.[0]?.message?.content
      ?? result?.message?.content
      ?? result?.content
      ?? '¡Hola! Estoy aquí para ayudarte en SimplyOver. ¿Qué estás buscando?'

    // Guardar sesión si hay usuario autenticado
    if (req.user) {
      const sessionId = generateUUID()
      try {
        await query(
          `INSERT INTO ia_sessions (id, user_id, model_id, messages, created_at, updated_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [sessionId, req.user.id, String(modelId), JSON.stringify([...messages, { role: 'assistant', content: reply }])]
        )
      } catch (saveErr) {
        console.warn('[AI/Chat] Could not save session:', saveErr.message)
      }
    }

    res.json({ reply })
  } catch (err) {
    console.warn('[AI/Chat] Error de la API (usando respuestas estáticas de respaldo):', err.message)
    // Fallback con respuestas estáticas si SpiderIA no está disponible
    const fallbackReplies = [
      '¡Hola! Soy el asistente de SimplyOver. ¿Buscas overlays de algún estilo en particular?',
      'Puedo ayudarte a encontrar el overlay perfecto. ¿Prefieres algo gratuito o premium?',
      'En SimplyOver tenemos miles de overlays. Prueba a buscar por categoría en el navbar.',
    ]
    const fallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)]
    res.json({ reply: fallback, fallback: true })
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

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Crea un overlay ${style} para ${format}. Descripción: ${prompt}. Colores sugeridos: ${colors.join(', ') || 'elige tú'}` }
  ]

  try {
    const modelsData = await spiderWeb.getIAModels()
    const fallbackModelId = modelsData?.models?.[0]?.id || 1

    const settingRow = await queryOne(`SELECT setting_value FROM site_settings WHERE setting_key = 'ai_model_id'`);
    const adminModelId = settingRow ? JSON.parse(settingRow.setting_value) : null;
    const modelId = adminModelId || fallbackModelId;

    const result = await spiderWeb.iaChat(modelId, messages)
    let content = result?.choices?.[0]?.message?.content ?? result?.message?.content ?? result?.content ?? '{}'

    // Intentar parsear como JSON
    let parsed
    try {
      // Extraer JSON del bloque de código si está envuelto
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]+?)```/)
      if (jsonMatch) content = jsonMatch[1]
      parsed = JSON.parse(content)
    } catch {
      parsed = { title: 'Custom Overlay', description: content, colorScheme: {}, fonts: [], elements: [], animations: [] }
    }

    // Guardar el draft en canvas_drafts
    const draftId = generateUUID()
    await query(
      `INSERT INTO canvas_drafts (id, creator_id, name, canvas_data, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'DRAFT', NOW(), NOW())`,
      [draftId, req.user.id, parsed.title || 'AI Generated Overlay', JSON.stringify(parsed)]
    )

    res.json({ success: true, draftId, template: parsed })
  } catch (err) {
    console.error('[AI/Generate] Error:', err.message)
    res.status(500).json({ error: 'Generation failed. Please try again.' })
  }
})

export default router
