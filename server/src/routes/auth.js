import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { getMsalClient, REDIRECT_URI, SCOPES } from '../lib/msal.js'

export const authRouter = Router()

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

    let user = await prisma.user.findUnique({ where: { microsoftOid } })
    if (!user) {
      const bootstrapAdmin = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase()
      const role = bootstrapAdmin && email === bootstrapAdmin ? 'ADMINISTRATIVO' : 'SOLICITANTE'
      user = await prisma.user.create({ data: { microsoftOid, email, name, role } })
    }

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role }
    res.redirect(process.env.CLIENT_APP_URL)
  } catch (err) {
    console.error('Error en callback de Microsoft:', err)
    res.status(500).send('No se pudo completar el inicio de sesión con Microsoft.')
  }
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
