import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getMsalClient, REDIRECT_URI, SCOPES } from '../lib/msal.js'
import * as usersRepo from '../lib/repos/users.js'

export const authRouter = Router()

const LOCAL_LOGIN_MAX_ATTEMPTS = 5
const LOCAL_LOGIN_WINDOW_MS = 15 * 60 * 1000
const localLoginAttempts = new Map()

function isRateLimited(ip) {
  const entry = localLoginAttempts.get(ip)
  if (!entry) return false
  if (Date.now() - entry.firstAttemptAt > LOCAL_LOGIN_WINDOW_MS) {
    localLoginAttempts.delete(ip)
    return false
  }
  return entry.count >= LOCAL_LOGIN_MAX_ATTEMPTS
}

function registerFailedAttempt(ip) {
  const entry = localLoginAttempts.get(ip)
  if (!entry || Date.now() - entry.firstAttemptAt > LOCAL_LOGIN_WINDOW_MS) {
    localLoginAttempts.set(ip, { count: 1, firstAttemptAt: Date.now() })
  } else {
    entry.count += 1
  }
}

authRouter.get('/login', async (req, res) => {
  try {
    const url = await getMsalClient().getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
    })
    res.redirect(url)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

authRouter.get('/callback', async (req, res) => {
  const { code, error, error_description: errorDescription } = req.query

  if (error) {
    return res.status(401).send(`Error de autenticación: ${errorDescription || error}`)
  }

  try {
    const tokenResponse = await getMsalClient().acquireTokenByCode({
      code,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
    })

    const claims = tokenResponse.idTokenClaims
    const microsoftOid = claims.oid
    const email = (claims.preferred_username || claims.email || '').toLowerCase()
    const name = claims.name || email

    let user = await usersRepo.findByMicrosoftOid(microsoftOid)
    if (!user) {
      const bootstrapAdmin = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase()
      const role = bootstrapAdmin && email === bootstrapAdmin ? 'ADMINISTRATIVO' : 'SOLICITANTE'
      user = await usersRepo.createUser({ microsoftOid, email, name, role })
    }

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role, microsoftOid: user.microsoftOid }
    res.redirect(process.env.CLIENT_APP_URL)
  } catch (err) {
    console.error('Error en callback de Microsoft:', err)
    res.status(500).send('No se pudo completar el inicio de sesión con Microsoft.')
  }
})

authRouter.post('/local-login', async (req, res) => {
  const ip = req.ip
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo más tarde.' })
  }

  const { username, password } = req.body
  const validUsername = username && username === process.env.ADMIN_LOCAL_USERNAME
  const validPassword =
    validUsername && password && (await bcrypt.compare(password, process.env.ADMIN_LOCAL_PASSWORD_HASH || ''))

  if (!validUsername || !validPassword) {
    registerFailedAttempt(ip)
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  }

  let user = await usersRepo.findByMicrosoftOid('local-admin')
  if (!user) {
    user = await usersRepo.createUser({
      microsoftOid: 'local-admin',
      email: 'admin-local@portal.local',
      name: 'Administrador Local',
      role: 'ADMINISTRATIVO',
    })
  }

  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role, microsoftOid: user.microsoftOid }
  res.json({ user: req.session.user })
})

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

authRouter.get('/me', (req, res) => {
  res.json({ user: req.session.user ?? null })
})
