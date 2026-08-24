/**
 * lib/authExpress.js
 * Utilidades de autenticación JWT para SimplyOver — compatible con Express puro.
 * (Versión sin Next.js — reemplaza lib/auth.js para el servidor Express)
 */

import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
)
const TOKEN_TTL = '7d'
const COOKIE_NAME = 'so_token'

/**
 * Genera un JWT firmado para el usuario.
 * @param {{ id: string, username: string, email: string, role: string }} payload
 * @returns {Promise<string>} token
 */
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(SECRET)
}

/**
 * Verifica y decodifica un JWT.
 * @param {string} token
 * @returns {Promise<object|null>} payload o null si inválido
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch {
    return null
  }
}

/**
 * Extrae el token desde las cookies de Express.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractToken(req) {
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME]
  const auth = req.headers['authorization'] ?? ''
  if (auth.startsWith('Bearer ')) return auth.slice(7)
  return null
}

/**
 * Middleware Express: adjunta session al req si hay token válido.
 * Si no hay token o es inválido, req.user = null (no bloquea).
 */
export async function optionalAuth(req, res, next) {
  const token = extractToken(req)
  if (token) {
    req.user = await verifyToken(token)
  } else {
    req.user = null
  }
  res.locals.user = req.user
  next()
}

/**
 * Middleware Express: requiere sesión autenticada.
 * Si no hay sesión válida redirige a /login.
 */
export async function requireAuth(req, res, next) {
  const token = extractToken(req)
  if (!token) return res.redirect('/login?error=session_required')

  const session = await verifyToken(token)
  if (!session) return res.redirect('/login?error=session_expired')

  req.user = session
  res.locals.user = session
  next()
}

/**
 * Middleware Express: requiere rol de administrador.
 */
export async function requireAdmin(req, res, next) {
  const token = extractToken(req)
  if (!token) return res.redirect('/login?error=session_required')

  const session = await verifyToken(token)
  if (!session) return res.redirect('/login?error=session_expired')
  if (session.role !== 'admin') return res.status(403).render('error', { message: 'Acceso denegado.' })

  req.user = session
  res.locals.user = session
  next()
}

/**
 * Opciones de cookie HTTP-only para Express.
 */
export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 * 1000,
    path: '/',
  }
}

/**
 * Establece la cookie de autenticación en la respuesta.
 */
export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions())
}

/**
 * Elimina la cookie de autenticación (logout).
 */
export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}
