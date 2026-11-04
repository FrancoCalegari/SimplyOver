/**
 * lib/aiService.js
 * Servicio unificado de Inteligencia Artificial para SimplyOver.
 * 
 * Arquitectura de cascada (Failover):
 *   1. Motor Primario: Google Gemini API (gemini-2.5-flash)
 *   2. Motor Respaldo: SpiderWeb API (SpiderIA)
 *   3. Resguardo Local: Respuestas estáticas curadas
 * 
 * Marca Blanca Estricta:
 *   - Identidad 100% nativa: "SimplyOver AI".
 *   - Prohibido revelar proveedores (Gemini, Google, SpiderWeb, OpenAI, etc.).
 *   - Sanitización de salidas para filtrar menciones accidentales.
 */

import dotenv from 'dotenv';
dotenv.config();

import { spiderWeb } from './SpiderWebService.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL   = process.env.GEMINI_MODEL   || 'gemini-2.5-flash';
const AI_TIMEOUT_MS  = Number(process.env.AI_TIMEOUT_MS || 8000);
const IS_DEBUG       = process.env.DEBUG_MODE === 'true';

const STRICT_WHITE_LABEL_RULES = `
REGLAS ESTRICTAS DE IDENTIDAD:
- Tu nombre es "SimplyOver AI" y eres la Inteligencia Artificial nativa y exclusiva de la plataforma SimplyOver.
- NUNCA menciones a Google, Gemini, SpiderWeb, SpiderIA ni OpenAI.
- Si te preguntan quién te creó, qué modelo eres o cómo funcionas, responde que eres el asistente de IA oficial y propio de SimplyOver.
- Tu misión es asistir a streamers y creadores de contenido con overlays, OBS Studio, personalización y navegación por el marketplace.
`;

/**
 * Sanitiza cualquier texto de salida para evitar que se filtren nombres de proveedores.
 * @param {string} text 
 * @returns {string}
 */
export function sanitizeAIOutput(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\b(google\s+gemini|gemini|spideria|spiderweb|chatgpt|openai)\b/gi, 'SimplyOver AI')
    .trim();
}

/**
 * Llama a la API de Gemini mediante fetch nativo con timeout.
 * @param {object} params
 * @param {string} params.systemInstruction
 * @param {Array<{role: string, content: string}>} params.messages
 * @param {boolean} [params.jsonMode=false]
 * @param {number} [params.timeoutMs]
 * @returns {Promise<string>}
 */
async function callGemini({ systemInstruction, messages = [], jsonMode = false, timeoutMs = AI_TIMEOUT_MS }) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Formatear contents para Gemini
    // En Gemini los roles válidos son 'user' y 'model'
    const contents = [];
    for (const msg of messages) {
      if (!msg.content || typeof msg.content !== 'string') continue;
      const role = msg.role === 'assistant' ? 'model' : 'user';

      // Evitar mensajes consecutivos con el mismo rol si es posible
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n${msg.content}`;
      } else {
        contents.push({
          role,
          parts: [{ text: msg.content }]
        });
      }
    }

    // Gemini exige que el primer mensaje de contents sea 'user'
    if (contents.length > 0 && contents[0].role !== 'user') {
      contents.unshift({
        role: 'user',
        parts: [{ text: 'Hola' }]
      });
    }

    const body = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: `${STRICT_WHITE_LABEL_RULES}\n${systemInstruction}` }]
      };
    }

    if (jsonMode) {
      body.generationConfig.responseMimeType = 'application/json';
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const replyText = candidate?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error('Empty response from Gemini API');
    }

    return replyText;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Llama a SpiderWeb (SpiderIA) como motor de respaldo.
 * @param {object} params
 * @param {string} params.systemInstruction
 * @param {Array<{role: string, content: string}>} params.messages
 * @param {number|string} [params.modelId]
 * @returns {Promise<string>}
 */
async function callSpiderWeb({ systemInstruction, messages = [], modelId = 1 }) {
  const fullMessages = [
    { role: 'system', content: `${STRICT_WHITE_LABEL_RULES}\n${systemInstruction || ''}` },
    ...messages
  ];

  const result = await spiderWeb.iaChat(modelId, fullMessages);
  const reply = result?.choices?.[0]?.message?.content
    ?? result?.message?.content
    ?? result?.content
    ?? result;

  if (typeof reply === 'string') {
    return reply;
  }
  if (reply && typeof reply === 'object' && reply.content) {
    return String(reply.content);
  }

  throw new Error('Invalid response structure from SpiderWeb');
}

/**
 * Orquestador principal para el Chat de SimplyOver AI.
 * Intenta Gemini -> Fallback SpiderWeb -> Fallback local.
 * 
 * @param {object} options
 * @param {string} options.message Mensaje del usuario
 * @param {Array} [options.history=[]] Historial de conversación
 * @param {string} [options.systemPrompt=''] Instrucciones del sistema
 * @param {number} [options.fallbackModelId=1] Model ID para SpiderWeb
 * @returns {Promise<{ reply: string, isFallback?: boolean }>}
 */
export async function getAIChatReply({ message, history = [], systemPrompt = '', fallbackModelId = 1 }) {
  // Construir historial limpio
  const cleanHistory = history.slice(-10).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content || ''
  }));
  cleanHistory.push({ role: 'user', content: message });

  // 1. Intento Primario: Gemini
  if (GEMINI_API_KEY) {
    try {
      if (IS_DEBUG) console.log('[SimplyOver AI Engine] Consultando motor primario...');
      const geminiReply = await callGemini({
        systemInstruction: systemPrompt,
        messages: cleanHistory,
        jsonMode: false,
      });

      if (geminiReply?.trim()) {
        if (IS_DEBUG) console.log('[SimplyOver AI Engine] Respuesta obtenida con éxito (Primario).');
        return { reply: sanitizeAIOutput(geminiReply) };
      }
    } catch (geminiErr) {
      console.warn('[SimplyOver AI Engine] Primario no disponible, derivando a respaldo:', geminiErr.message);
    }
  }

  // 2. Intento Secundario (Fallback): SpiderWeb
  try {
    if (IS_DEBUG) console.log('[SimplyOver AI Engine] Consultando motor de respaldo...');
    const spiderReply = await callSpiderWeb({
      systemInstruction: systemPrompt,
      messages: cleanHistory,
      modelId: fallbackModelId,
    });

    if (spiderReply?.trim()) {
      if (IS_DEBUG) console.log('[SimplyOver AI Engine] Respuesta obtenida con éxito (Respaldo).');
      return { reply: sanitizeAIOutput(spiderReply) };
    }
  } catch (spiderErr) {
    console.warn('[SimplyOver AI Engine] Respaldo no disponible:', spiderErr.message);
  }

  // 3. Fallback Local de Emergencia
  const localFallbacks = [
    '¡Hola! Soy tu asistente de SimplyOver. ¿Estás buscando algún tipo de overlay en especial para OBS?',
    'En SimplyOver tenemos alertas, marcos de cámara y paquetes completos. ¿Te gustaría ver las opciones gratuitas o premium?',
    'Puedo guiarte por las categorías del marketplace. ¿Qué estilo visual tiene tu canal de stream?',
  ];
  const chosen = localFallbacks[Math.floor(Math.random() * localFallbacks.length)];
  return { reply: chosen, isFallback: true };
}

/**
 * Orquestador para la generación de especificaciones de plantillas / overlays (AI Studio).
 * 
 * @param {object} options
 * @param {string} options.prompt
 * @param {string} options.style
 * @param {Array<string>} options.colors
 * @param {string} options.format
 * @param {string} options.systemPrompt
 * @param {number} [options.fallbackModelId=1]
 * @returns {Promise<object>} Objeto JSON estructurado de la plantilla
 */
export async function getAITemplateGeneration({ prompt, style = 'cyberpunk', colors = [], format = '1920x1080', systemPrompt = '', fallbackModelId = 1 }) {
  const userRequest = `Crea un overlay ${style} para ${format}. Descripción: ${prompt}. Colores sugeridos: ${colors.join(', ') || 'elige tú'}`;
  const messages = [{ role: 'user', content: userRequest }];

  let rawOutput = '';

  // 1. Intento Primario: Gemini en modo JSON
  if (GEMINI_API_KEY) {
    try {
      if (IS_DEBUG) console.log('[SimplyOver AI Generator] Generando especificación con motor primario (JSON Mode)...');
      rawOutput = await callGemini({
        systemInstruction: systemPrompt,
        messages,
        jsonMode: true,
      });
    } catch (err) {
      console.warn('[SimplyOver AI Generator] Primario falló, pasando a respaldo:', err.message);
    }
  }

  // 2. Intento Secundario: SpiderWeb
  if (!rawOutput) {
    try {
      if (IS_DEBUG) console.log('[SimplyOver AI Generator] Generando especificación con motor de respaldo...');
      rawOutput = await callSpiderWeb({
        systemInstruction: systemPrompt,
        messages,
        modelId: fallbackModelId,
      });
    } catch (err) {
      console.warn('[SimplyOver AI Generator] Respaldo falló:', err.message);
    }
  }

  if (!rawOutput) {
    throw new Error('Both AI engines failed to generate overlay specification');
  }

  // Parsear JSON (limpiando bloques markdown si existen)
  let cleanJsonStr = rawOutput.trim();
  const jsonMatch = cleanJsonStr.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (jsonMatch) cleanJsonStr = jsonMatch[1];

  try {
    return JSON.parse(cleanJsonStr);
  } catch (parseErr) {
    return {
      title: 'Custom Overlay',
      description: sanitizeAIOutput(cleanJsonStr),
      colorScheme: {},
      fonts: [],
      elements: [],
      animations: []
    };
  }
}

