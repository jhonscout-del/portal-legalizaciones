import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { attachmentUpload } from '../lib/uploads.js'
import * as attachmentsRepo from '../lib/repos/attachments.js'

export const attachmentsRouter = Router()

attachmentsRouter.use(requireAuth)

const VALID_TYPES = new Set(['SOLICITUD', 'LEGALIZACION', 'INFORME_VIAJE'])

attachmentsRouter.get('/:relatedType/:relatedId', async (req, res) => {
  const { relatedType, relatedId } = req.params
  if (!VALID_TYPES.has(relatedType)) return res.status(400).json({ error: 'Tipo inválido' })
  const attachments = await attachmentsRepo.listAttachments(relatedType, Number(relatedId))
  res.json(attachments)
})

attachmentsRouter.post('/:relatedType/:relatedId', attachmentUpload.single('file'), async (req, res) => {
  const { relatedType, relatedId } = req.params
  if (!VALID_TYPES.has(relatedType)) return res.status(400).json({ error: 'Tipo inválido' })
  if (!req.file) return res.status(400).json({ error: 'Ningún archivo enviado' })

  const attachment = await attachmentsRepo.createAttachment({
    relatedType,
    relatedId: Number(relatedId),
    file: req.file,
    uploadedById: req.session.user.id,
  })
  res.status(201).json(attachment)
})

attachmentsRouter.get('/file/:id', async (req, res) => {
  const found = await attachmentsRepo.downloadAttachment(req.params.id)
  if (!found) return res.status(404).json({ error: 'No encontrado' })
  const { attachment, buffer } = found
  res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.filename)}"`)
  res.send(buffer)
})

attachmentsRouter.delete('/:id', async (req, res) => {
  const attachment = await attachmentsRepo.getAttachment(req.params.id)
  if (!attachment) return res.status(404).json({ error: 'No encontrado' })
  if (Number(attachment.uploadedById) !== req.session.user.id && !req.session.user.roles.includes('ADMINISTRATIVO')) {
    return res.status(403).json({ error: 'No autorizado' })
  }
  await attachmentsRepo.removeAttachment(req.params.id)
  res.json({ ok: true })
})
