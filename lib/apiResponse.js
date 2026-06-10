/**
 * lib/apiResponse.js
 * Constructores de respuestas JSON estandarizadas para SimplyOver API.
 * Todas las respuestas siguen el esquema: { ok, data?, error?, meta? }
 */

import { NextResponse } from 'next/server'

/**
 * 200 OK con datos
 * @param {any} data
 * @param {{ status?, meta? }} opts
 */
export function ok(data, { status = 200, meta } = {}) {
  return NextResponse.json({ ok: true, data, ...(meta ? { meta } : {}) }, { status })
}

/**
 * 201 Created
 * @param {any} data
 */
export function created(data) {
  return NextResponse.json({ ok: true, data }, { status: 201 })
}

/**
 * 400 Bad Request
 * @param {string} message
 * @param {object} [details]
 */
export function badRequest(message, details) {
  return NextResponse.json(
    { ok: false, error: message, ...(details ? { details } : {}) },
    { status: 400 }
  )
}

/**
 * 401 Unauthorized
 */
export function unauthorized(message = 'No autorizado.') {
  return NextResponse.json({ ok: false, error: message }, { status: 401 })
}

/**
 * 403 Forbidden
 */
export function forbidden(message = 'Acceso denegado.') {
  return NextResponse.json({ ok: false, error: message }, { status: 403 })
}

/**
 * 404 Not Found
 * @param {string} entity - nombre de la entidad
 */
export function notFound(entity = 'Recurso') {
  return NextResponse.json(
    { ok: false, error: `${entity} no encontrado.` },
    { status: 404 }
  )
}

/**
 * 409 Conflict
 */
export function conflict(message) {
  return NextResponse.json({ ok: false, error: message }, { status: 409 })
}

/**
 * 500 Internal Server Error
 * @param {unknown} err
 */
export function serverError(err) {
  const isDev = process.env.NODE_ENV === 'development'
  console.error('[SimplyOver API Error]', err)
  return NextResponse.json(
    {
      ok: false,
      error: 'Error interno del servidor.',
      ...(isDev && err instanceof Error ? { detail: err.message } : {}),
    },
    { status: 500 }
  )
}

/**
 * Sanitiza un string para interpolación SQL segura.
 * Escapa comillas simples.
 * @param {string|any} value
 * @returns {string}
 */
export function sanitize(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/'/g, "''").replace(/;/g, '').trim()
}

/**
 * Valida un UUID v4.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

/**
 * Parsea y valida parámetros de paginación desde URLSearchParams.
 * @param {URLSearchParams} params
 * @returns {{ page: number, limit: number }}
 */
export function parsePagination(params) {
  const page  = Math.max(1, parseInt(params.get('page')  ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') ?? '24', 10)))
  return { page, limit }
}
