/**
 * POST /api/auth/login
 * Autentica un usuario existente.
 *
 * Body: { email, password }
 * Responde: { ok: true, data: { user, token } } + Set-Cookie
 */

import bcrypt from 'bcryptjs'
import { spiderWeb }  from '@/lib/SpiderWebService.js'
import { signToken, buildAuthCookie } from '@/lib/auth.js'
import { ok, badRequest, unauthorized, serverError, sanitize } from '@/lib/apiResponse.js'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password } = body ?? {}

    if (!email || !password) {
      return badRequest('Email y contraseña son obligatorios.')
    }

    const safeEmail = sanitize(email.toLowerCase())
    const user      = await spiderWeb.getUserByEmail(safeEmail)

    // No revelar si existe o no (timing-safe)
    if (!user) {
      await bcrypt.hash('dummy', 12) // consumir tiempo igual
      return unauthorized('Credenciales inválidas.')
    }

    if (user.status !== 'active') {
      return unauthorized('Tu cuenta está suspendida o baneada. Contactá soporte.')
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return unauthorized('Credenciales inválidas.')
    }

    const token = await signToken({
      id:       user.id,
      username: user.username,
      email:    user.email,
      role:     user.role,
    })

    const response = ok({
      user: {
        id:               user.id,
        username:         user.username,
        email:            user.email,
        role:             user.role,
        avatar_storage_id: user.avatar_storage_id,
      },
      token,
    })

    response.headers.set('Set-Cookie', buildAuthCookie(token))
    return response
  } catch (err) {
    return serverError(err)
  }
}
