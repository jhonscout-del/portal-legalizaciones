import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { signatureUpload } from '../lib/uploads.js'
import { uploadFile, downloadFile, deleteFile, SIGNATURES_FOLDER } from '../lib/graphFiles.js'
import * as usersRepo from '../lib/repos/users.js'

export const usersRouter = Router()

usersRouter.use(requireAuth)

usersRouter.get('/', requireRole('ADMINISTRATIVO'), async (req, res) => {
  res.json(await usersRepo.listUsers())
})

usersRouter.put('/:id/roles', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const { roles } = req.body
  if (!Array.isArray(roles) || roles.length === 0) {
    return res.status(400).json({ error: 'roles debe ser una lista no vacía' })
  }
  if (roles.some((r) => !usersRepo.ALL_ROLES.includes(r))) {
    return res.status(400).json({ error: 'Rol inválido' })
  }
  const user = await usersRepo.updateUserRoles(req.params.id, roles)
  res.json(user)
})

// Autoservicio: cualquier usuario declara quién es su aprobador. Esa persona
// recibe automáticamente el rol APROBADOR (sin quitarle sus roles actuales).
usersRouter.put('/me/aprobador', async (req, res) => {
  const { aprobadorEmail } = req.body
  if (aprobadorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(aprobadorEmail)) {
    return res.status(400).json({ error: 'Correo de aprobador inválido' })
  }
  const user = await usersRepo.setAprobadorEmail(req.session.user.id, aprobadorEmail || null)
  req.session.user = { ...req.session.user, aprobadorEmail: user.aprobadorEmail }
  res.json({ user: req.session.user })
})

function extname(filename) {
  const i = filename.lastIndexOf('.')
  return i === -1 ? '' : filename.slice(i)
}

usersRouter.post('/me/signature', signatureUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Ningún archivo enviado' })

  const current = await usersRepo.getUser(req.session.user.id)
  const { driveItemId } = await uploadFile({
    buffer: req.file.buffer,
    folder: SIGNATURES_FOLDER,
    filename: `user-${req.session.user.id}-${Date.now()}${extname(req.file.originalname)}`,
    mimeType: req.file.mimetype,
  })

  const user = await usersRepo.updateUserSignature(req.session.user.id, driveItemId, req.file.mimetype)

  if (current?.signatureFileId) {
    deleteFile(current.signatureFileId).catch((err) => console.error('No se pudo borrar la firma anterior:', err.message))
  }

  res.json(user)
})

usersRouter.get('/:id/signature', async (req, res) => {
  const user = await usersRepo.getUser(req.params.id)
  if (!user?.signatureFileId) return res.status(404).json({ error: 'Sin firma registrada' })
  const buffer = await downloadFile(user.signatureFileId)
  res.setHeader('Content-Type', user.signatureMimeType || 'image/png')
  res.send(buffer)
})
