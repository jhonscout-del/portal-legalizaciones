import { Router } from 'express'
import path from 'node:path'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { signatureUpload, SIGNATURES_DIR, deleteFileIfExists } from '../lib/uploads.js'

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

usersRouter.post('/me/signature', signatureUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Ningún archivo enviado' })

  const current = await prisma.user.findUnique({ where: { id: req.session.user.id } })
  const user = await prisma.user.update({
    where: { id: req.session.user.id },
    data: { signatureImagePath: req.file.filename },
  })
  if (current?.signatureImagePath) {
    deleteFileIfExists(path.join(SIGNATURES_DIR, current.signatureImagePath))
  }
  res.json(user)
})

usersRouter.get('/:id/signature', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } })
  if (!user?.signatureImagePath) return res.status(404).json({ error: 'Sin firma registrada' })
  res.sendFile(path.join(SIGNATURES_DIR, user.signatureImagePath))
})
