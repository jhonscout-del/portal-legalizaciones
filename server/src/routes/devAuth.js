import { Router } from 'express'
import * as usersRepo from '../lib/repos/users.js'

// Solo se monta cuando DEV_AUTH_BYPASS=true (ver app.js). Permite iniciar sesión
// sin credenciales reales de Microsoft Entra ID mientras se configura el
// registro de la app en Azure. NUNCA debe habilitarse en producción.
export const devAuthRouter = Router()

devAuthRouter.post('/dev-login', async (req, res) => {
  const { email, name, role } = req.body
  if (!email || !role) {
    return res.status(400).json({ error: 'email y role son obligatorios' })
  }

  const user = await usersRepo.upsertUserByEmail({ email: email.toLowerCase(), name: name || email, role })

  req.session.user = {
    id: user.id, name: user.name, email: user.email, roles: user.roles,
    microsoftOid: user.microsoftOid, aprobadorEmail: user.aprobadorEmail,
  }
  res.json({ user: req.session.user })
})
