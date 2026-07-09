import { Router } from 'express'
import path from 'node:path'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { attachmentUpload, ATTACHMENTS_DIR, deleteFileIfExists } from '../lib/uploads.js'

export const attachmentsRouter = Router()

attachmentsRouter.use(requireAuth)

const VALID_TYPES = new Set(['SOLICITUD', 'LEGALIZACION', 'INFORME_VIAJE'])

export async function listAttachments(relatedType, relatedId) {
  return prisma.attachment.findMany({
    where: { relatedType, relatedId },
    include: { uploadedBy: true },
    orderBy: { createdAt: 'desc' },
  })
}

attachmentsRouter.get('/:relatedType/:relatedId', async (req, res) => {
  const { relatedType, relatedId } = req.params
  if (!VALID_TYPES.has(relatedType)) return res.status(400).json({ error: 'Tipo inválido' })
  const attachments = await listAttachments(relatedType, Number(relatedId))
  res.json(attachments)
})

attachmentsRouter.post('/:relatedType/:relatedId', attachmentUpload.single('file'), async (req, res) => {
  const { relatedType, relatedId } = req.params
  if (!VALID_TYPES.has(relatedType)) return res.status(400).json({ error: 'Tipo inválido' })
  if (!req.file) return res.status(400).json({ error: 'Ningún archivo enviado' })

  const attachment = await prisma.attachment.create({
    data: {
      relatedType,
      relatedId: Number(relatedId),
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.filename,
      uploadedById: req.session.user.id,
    },
    include: { uploadedBy: true },
  })
  res.status(201).json(attachment)
})

attachmentsRouter.get('/file/:id', async (req, res) => {
  const attachment = await prisma.attachment.findUnique({ where: { id: Number(req.params.id) } })
  if (!attachment) return res.status(404).json({ error: 'No encontrado' })
  res.download(path.join(ATTACHMENTS_DIR, attachment.storagePath), attachment.filename)
})

attachmentsRouter.delete('/:id', async (req, res) => {
  const attachment = await prisma.attachment.findUnique({ where: { id: Number(req.params.id) } })
  if (!attachment) return res.status(404).json({ error: 'No encontrado' })
  if (attachment.uploadedById !== req.session.user.id && req.session.user.role !== 'ADMINISTRATIVO') {
    return res.status(403).json({ error: 'No autorizado' })
  }
  await prisma.attachment.delete({ where: { id: attachment.id } })
  deleteFileIfExists(path.join(ATTACHMENTS_DIR, attachment.storagePath))
  res.json({ ok: true })
})
