/**
 * POST /api/ia/chat
 * Envía mensajes a SpiderIA y persiste la sesión en DB.
 *
 * Body:
 *   { modelId, message, sessionId? (UUID para continuar sesión), draftId? }
 *
 * Responde: { reply, sessionId, messages[] }
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import {
  ok, badRequest, serverError, sanitize, isValidUUID,
} from '@/lib/apiResponse.js'

// Límite de historial de mensajes que se envía a la IA
const MAX_HISTORY = 20

export async function POST(request) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const body      = await request.json()
    const { modelId, message, sessionId, draftId } = body ?? {}

    if (!modelId || typeof modelId !== 'string') {
      return badRequest('modelId es obligatorio.')
    }
    if (!message || message.trim().length === 0) {
      return badRequest('El mensaje no puede estar vacío.')
    }
    if (message.length > 4000) {
      return badRequest('El mensaje no puede superar 4000 caracteres.')
    }

    let currentSession   = null
    let currentMessages  = []

    // ── Recuperar sesión existente o crear nueva ───────────
    if (sessionId && isValidUUID(sessionId)) {
      currentSession = await spiderWeb.queryOne(
        `SELECT id, messages FROM ia_sessions
         WHERE id = '${sessionId}' AND user_id = '${session.id}'
         LIMIT 1`
      )
      if (currentSession) {
        try {
          currentMessages = JSON.parse(
            typeof currentSession.messages === 'string'
              ? currentSession.messages
              : JSON.stringify(currentSession.messages)
          )
        } catch { currentMessages = [] }
      }
    }

    // ── Agregar mensaje del usuario al historial ───────────
    const userMessage = { role: 'user', content: sanitize(message) }
    currentMessages.push(userMessage)

    // Limitar historial para no exceder tokens
    const historyToSend = currentMessages.slice(-MAX_HISTORY)

    // System prompt de contexto
    const systemMessage = {
      role:    'system',
      content: `Sos un asistente creativo especializado en diseño de overlays para OBS.
Ayudás a streamers y creadores a diseñar overlays visuales atractivos.
Podés dar ideas, sugerir paletas de colores, describir estilos visuales, y ayudar
con el Canvas del Estudio de Creación de SimplyOver.
Respondé siempre en español, de forma concisa y creativa.`,
    }

    // ── Llamar a SpiderIA ──────────────────────────────────
    const reply = await spiderWeb.iaChat(sanitize(modelId), [
      systemMessage,
      ...historyToSend,
    ])

    const assistantMessage = {
      role:    'assistant',
      content: typeof reply === 'string' ? reply : reply?.content ?? JSON.stringify(reply),
    }
    currentMessages.push(assistantMessage)

    // ── Persistir / actualizar sesión ──────────────────────
    const messagesJson = JSON.stringify(currentMessages)
      .replace(/'/g, "''")

    let newSessionId = currentSession?.id

    if (!currentSession) {
      // Crear nueva sesión
      const draftVal = draftId && isValidUUID(draftId) ? `'${draftId}'` : 'NULL'
      const created  = await spiderWeb.queryOne(
        `INSERT INTO ia_sessions (user_id, draft_id, model_id, messages)
         VALUES ('${session.id}', ${draftVal}, '${sanitize(modelId)}', '${messagesJson}')
         RETURNING id`
      )
      newSessionId = created?.id
    } else {
      await spiderWeb.query(
        `UPDATE ia_sessions
         SET messages = '${messagesJson}', model_id = '${sanitize(modelId)}'
         WHERE id = '${currentSession.id}'`
      )
    }

    return ok({
      sessionId: newSessionId,
      reply:     assistantMessage.content,
      messages:  currentMessages,
    })
  } catch (err) {
    return serverError(err)
  }
}
