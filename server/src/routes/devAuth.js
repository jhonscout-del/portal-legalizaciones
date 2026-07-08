import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

// Solo se monta cuando DEV_AUTH_BYPASS=true (ver app.js). Permite iniciar sesión
// sin credenciales reales de Microsoft Entra ID mientras se configura el
// registro de la app en Azure. NUNCA debe habilitarse en producción.
export const devAuthRouter = Router()

devAuthRouter.post('/dev-login', async (req, res) => {
  const { email, name, role } = req.body
  if (!email || !role) {
    return res.status(400).json({ error: 'email y role son obligatorios' })
  }

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { role },
    create: {
      email: email.toLowerCase(),
      name: name || email,
      role,
      microsoftOid: `dev-${email.toLowerCase()}`,
    },
  })

  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role }
  res.json({ user: req.session.user })
})
