/**
 * routes/auth.js
 * Rutas de autenticación: login, register, logout.
 */

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query, queryOne, generateUUID } from '../lib/db.js'
import { signToken, setAuthCookie, clearAuthCookie } from '../lib/authExpress.js'
import { sendVerificationEmail } from '../lib/email.js'
import crypto from 'crypto'

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
    
    // Token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Insertar usuario
    await query(
      `INSERT INTO users (id, username, email, password_hash, display_name, role, status, verification_token, email_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'user', 'active', ?, FALSE, NOW(), NOW())`,
      [userId, username, email, passwordHash, username, verificationToken]
    )

    // Enviar correo de verificación en segundo plano
    sendVerificationEmail(email, username, verificationToken).catch(err => console.error(err))

    // Generar token y establecer cookie
    const token = await signToken({
      id: userId,
      username,
      email,
      role: 'user',
      display_name: username,
      avatar_storage_id: null
    })
    setAuthCookie(res, token)

    return res.redirect('/?welcome=1&verify=pending')
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
      'SELECT id, username, email, password_hash, role, status, display_name, avatar_storage_id FROM users WHERE email = ? LIMIT 1',
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
      display_name: user.display_name,
      avatar_storage_id: user.avatar_storage_id,
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
  return  res.redirect('/')
})

// ─── GET /auth/verify/:token ──────────────────────────────────────────────────
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params
  try {
    const user = await queryOne(
      'SELECT id FROM users WHERE verification_token = ? AND email_verified = FALSE LIMIT 1',
      [token]
    )
    if (!user) {
      return res.send('<script>alert("Invalid or expired verification token."); window.location.href="/";</script>')
    }

    await query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id = ?',
      [user.id]
    )

    res.send('<script>alert("Email verified successfully! Thank you."); window.location.href="/";</script>')
  } catch (err) {
    console.error('[Auth/Verify]', err)
    res.status(500).send('Server Error')
  }
})

export default router
