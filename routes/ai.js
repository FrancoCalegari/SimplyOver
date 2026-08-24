/**
 * routes/ai.js
 * IA Chat flotante + Generador de plantillas con IA (SpiderIA).
 */

import { Router } from 'express'
import { optionalAuth, requireAuth } from '../lib/authExpress.js'
import { query, generateUUID } from '../lib/db.js'

const router = Router()

const SPIDERIA_BASE = process.env.SPIDERWEBURL ?? 'http://190.220.229.45:7256/api/v1'
const API_KEY = process.env.SPIDERWEBAPIKEY ?? ''

async function callSpiderIA(messages, modelId = 1) {
  const response = await fetch(`${SPIDERIA_BASE}/ia/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
    },
    body: JSON.stringify({ model_id: modelId, messages }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`SpiderIA error ${response.status}: ${err}`)
  }

  return response.json()
}

// ─── POST /api/ai-chat ────────────────────────────────────────────────────────
// Chat flotante asistente del marketplace
router.post('/ai-chat', optionalAuth, async (req, res) => {
  const { message, history = [] } = req.body
  if (!message?.trim()) return res.status(400).json({ error: 'Missing message' })

  const systemPrompt = `Eres el asistente de SimplyOver, el marketplace número uno de overlays para OBS. 
Tu rol es ayudar a los usuarios a:
- Encontrar overlays por categoría, estilo o precio
- Navegar el marketplace (categorías: Anime, Esports, Neon, Gaming, Cyberpunk, Minimalista)
- Crear y gestionar boards y listas de favoritos
- Entender cómo funciona el sistema de compras y descargas
- Resolver dudas sobre el studio de creación y generación con IA
Responde siempre en el idioma del usuario. Sé amigable, conciso y útil.
Si el usuario pregunta por un overlay específico, sugiérele buscar en las categorías del navbar o usar el buscador.`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10), // últimos 10 mensajes del historial
    { role: 'user', content: message }
  ]

  try {
    const result = await callSpiderIA(messages)
    const reply = result?.choices?.[0]?.message?.content
      ?? result?.message
      ?? result?.content
      ?? '¡Hola! Estoy aquí para ayudarte en SimplyOver. ¿Qué estás buscando?'

    // Guardar sesión si hay usuario autenticado
    if (req.user) {
      const sessionId = generateUUID()
      try {
        await query(
          `INSERT INTO ia_sessions (id, user_id, model_id, messages, created_at, updated_at)
           VALUES (?, ?, 'gpt-4o-mini', ?, NOW(), NOW())`,
          [sessionId, req.user.id, JSON.stringify([...messages, { role: 'assistant', content: reply }])]
        )
      } catch (saveErr) {
        console.warn('[AI/Chat] Could not save session:', saveErr.message)
      }
    }

    res.json({ reply })
  } catch (err) {
    console.error('[AI/Chat]', err)
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
    const result = await callSpiderIA(messages, 'gpt-4o')
    let content = result?.choices?.[0]?.message?.content ?? result?.content ?? '{}'

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
    console.error('[AI/Generate]', err)
    res.status(500).json({ error: 'Generation failed. Please try again.' })
  }
})

export default router
