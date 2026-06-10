/**
 * POST /api/auth/register
 * Registra un nuevo usuario en SimplyOver.
 *
 * Body: { username, email, password, displayName? }
 * Responde: { ok: true, data: { user, token } } + Set-Cookie
 */

import bcrypt from 'bcryptjs'
import { spiderWeb }  from '@/lib/SpiderWebService.js'
import { signToken, buildAuthCookie } from '@/lib/auth.js'
import {
  ok, created, badRequest, conflict, serverError, sanitize,
} from '@/lib/apiResponse.js'

export async function POST(request) {
  try {
    const body = await request.json()
    const { username, email, password, displayName } = body ?? {}

    // ── Validaciones ────────────────────────────────────────
    if (!username || !email || !password) {
      return badRequest('Los campos username, email y password son obligatorios.')
    }
    if (username.length < 3 || username.length > 50) {
      return badRequest('El username debe tener entre 3 y 50 caracteres.')
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return badRequest('El username solo puede contener letras, números, guiones y puntos.')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequest('Email inválido.')
    }
    if (password.length < 8) {
      return badRequest('La contraseña debe tener al menos 8 caracteres.')
    }

    const safeUsername = sanitize(username)
    const safeEmail    = sanitize(email.toLowerCase())

    // ── Verificar duplicados ────────────────────────────────
    const existing = await spiderWeb.queryOne(
      `SELECT id FROM users
       WHERE email = '${safeEmail}' OR username = '${safeUsername}'
       LIMIT 1`
    )
    if (existing) {
      return conflict('El email o username ya está registrado.')
    }

    // ── Hash de contraseña ──────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12)

    // ── Crear usuario ───────────────────────────────────────
    const newUser = await spiderWeb.createUser({
      username: safeUsername,
      email:    safeEmail,
      passwordHash,
      displayName: displayName ? sanitize(displayName) : username,
    })

    // ── Generar token ────────────────────────────────────────
    const token = await signToken({
      id:       newUser.id,
      username: newUser.username,
      email:    safeEmail,
      role:     newUser.role ?? 'user',
    })

    const response = created({
      user: {
        id:       newUser.id,
        username: newUser.username,
        email:    safeEmail,
        role:     newUser.role ?? 'user',
      },
      token,
    })

    response.headers.set('Set-Cookie', buildAuthCookie(token))
    return response
  } catch (err) {
    return serverError(err)
  }
}
