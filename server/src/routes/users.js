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

usersRouter.put('/:id/role', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const { role } = req.body
  const user = await usersRepo.updateUserRole(req.params.id, role)
  res.json(user)
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
