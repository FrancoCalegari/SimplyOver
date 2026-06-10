/**
 * lib/auth.js
 * Utilidades de autenticación JWT para SimplyOver.
 * Firma tokens con HS256 usando la variable JWT_SECRET.
 */

import { SignJWT, jwtVerify } from 'jose'
import { NextResponse } from 'next/server'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
)

const TOKEN_TTL = '7d'

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
 * Extrae la sesión del usuario desde el header Authorization o cookie.
 * @param {Request} req
 * @returns {Promise<{ id, username, email, role }|null>}
 */
export async function getSession(req) {
  // 1. Intentar desde cookie
  const cookieHeader = req.headers.get('cookie') ?? ''
  const cookieToken  = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('so_token='))
    ?.split('=')[1]
    ?.trim()

  // 2. Intentar desde Authorization header
  const authHeader  = req.headers.get('authorization') ?? ''
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  const token = cookieToken ?? bearerToken
  if (!token) return null

  return verifyToken(token)
}

/**
 * Middleware: requiere sesión autenticada.
 * Devuelve { session } si OK, o { error: NextResponse } si no autorizado.
 * @param {Request} req
 * @returns {Promise<{ session: object }|{ error: NextResponse }>}
 */
export async function requireAuth(req) {
  const session = await getSession(req)
  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'No autorizado. Iniciá sesión para continuar.' },
        { status: 401 }
      ),
    }
  }
  return { session }
}

/**
 * Middleware: requiere rol de administrador.
 * @param {Request} req
 * @returns {Promise<{ session: object }|{ error: NextResponse }>}
 */
export async function requireAdmin(req) {
  const { session, error } = await requireAuth(req)
  if (error) return { error }
  if (session.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      ),
    }
  }
  return { session }
}

/**
 * Crea una cookie HTTP-only con el token.
 * @param {string} token
 * @returns {string} valor del header Set-Cookie
 */
export function buildAuthCookie(token) {
  return `so_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
}

/**
 * Cookie de logout (expirada).
 * @returns {string}
 */
export function buildLogoutCookie() {
  return 'so_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0'
}
