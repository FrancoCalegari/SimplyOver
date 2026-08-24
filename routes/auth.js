/**
 * routes/auth.js
 * Rutas de autenticación: login, register, logout.
 */

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query, queryOne, generateUUID } from '../lib/db.js'
import { signToken, setAuthCookie, clearAuthCookie } from '../lib/authExpress.js'

const router = Router()

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body

  // Validaciones básicas
  if (!username || !email || !password) {
    return res.redirect('/login?tab=register&error=missing_fields')
  }
  if (password !== confirmPassword) {
    return res.redirect('/login?tab=register&error=password_mismatch')
  }
  if (password.length < 6) {
    return res.redirect('/login?tab=register&error=password_short')
  }
  if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
    return res.redirect('/login?tab=register&error=invalid_username')
  }

  try {
    // Verificar si ya existe
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email, username]
    )
    if (existingUser) {
      return res.redirect('/login?tab=register&error=user_exists')
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 12)
    const userId = generateUUID()

    // Insertar usuario
    await query(
      `INSERT INTO users (id, username, email, password_hash, display_name, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'user', 'active', NOW(), NOW())`,
      [userId, username, email, passwordHash, username]
    )

    // Generar token y establecer cookie
    const token = await signToken({ id: userId, username, email, role: 'user' })
    setAuthCookie(res, token)

    return res.redirect('/?welcome=1')
  } catch (err) {
    console.error('[Auth/Register]', err)
    return res.redirect('/login?tab=register&error=server_error')
  }
})

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.redirect('/login?error=missing_fields')
  }

  try {
    const user = await queryOne(
      'SELECT id, username, email, password_hash, role, status FROM users WHERE email = ? LIMIT 1',
      [email]
    )

    if (!user) {
      return res.redirect('/login?error=invalid_credentials')
    }
    if (user.status === 'banned' || user.status === 'suspended') {
      return res.redirect('/login?error=account_suspended')
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return res.redirect('/login?error=invalid_credentials')
    }

    const token = await signToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    })
    setAuthCookie(res, token)

    // Redirigir al dashboard o a donde estaba
    const returnTo = req.query.returnTo || '/'
    return res.redirect(returnTo)
  } catch (err) {
    console.error('[Auth/Login]', err)
    return res.redirect('/login?error=server_error')
  }
})

// ─── GET /auth/logout ─────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  clearAuthCookie(res)
  return res.redirect('/?logout=1')
})

export default router
