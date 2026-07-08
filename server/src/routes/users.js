import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const usersRouter = Router()

usersRouter.use(requireAuth)

usersRouter.get('/', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } })
  res.json(users)
})

usersRouter.put('/:id/role', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const { role } = req.body
  const user = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: { role },
  })
  res.json(user)
})
