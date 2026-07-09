import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { renderLegalizacionPdf } from '../export/pdf/legalizacionTemplate.js'
import { buildLegalizacionWorkbook } from '../export/excel/legalizacionWorkbook.js'
import { listAttachments } from '../lib/repos/attachments.js'
import { sendMailToRecipients, resolveSenderUpn } from '../lib/graphMail.js'
import * as legalizacionesRepo from '../lib/repos/legalizaciones.js'

export const legalizacionesRouter = Router()

legalizacionesRouter.use(requireAuth)

async function withAttachments(legalizacion) {
  const attachments = await listAttachments('LEGALIZACION', legalizacion.id)
  return { ...legalizacion, attachments }
}

legalizacionesRouter.get('/', async (req, res) => {
  const legalizaciones = await legalizacionesRepo.listLegalizaciones()
  res.json(await Promise.all(legalizaciones.map(withAttachments)))
})

legalizacionesRouter.get('/:id', async (req, res) => {
  const legalizacion = await legalizacionesRepo.getLegalizacion(req.params.id)
  if (!legalizacion) return res.status(404).json({ error: 'No encontrada' })
  res.json(await withAttachments(legalizacion))
})

legalizacionesRouter.post('/', async (req, res) => {
  const { projectId, solicitudId, fechaSolicitudAnticipo, valorAnticipo, nitCc, nombreActividad, rubros, destinatarios } = req.body

  if (!projectId || !solicitudId || !rubros?.length) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const legalizacion = await legalizacionesRepo.createLegalizacion(
    { projectId, solicitudId, fechaSolicitudAnticipo, valorAnticipo, nitCc, nombreActividad, destinatarios },
    rubros,
    req.session.user.id,
  )

  if (destinatarios) {
    sendMailToRecipients({
      to: destinatarios,
      subject: `Nueva legalización No. ${legalizacion.id}`,
      html: `<p>Se registró la legalización No. ${legalizacion.id} para la actividad "${nombreActividad}".</p>`,
      senderUpn: resolveSenderUpn(req.session.user),
    }).catch((err) => console.error('Error enviando correo de legalización:', err.message))
  }

  res.status(201).json(await withAttachments(legalizacion))
})

legalizacionesRouter.post('/:id/firma-solicitante', async (req, res) => {
  const legalizacion = await legalizacionesRepo.setFirmaSolicitante(req.params.id)
  res.json(await withAttachments(legalizacion))
})

legalizacionesRouter.post('/:id/firma-contable', requireRole('CONTABLE'), async (req, res) => {
  const legalizacion = await legalizacionesRepo.setFirmaContable(req.params.id, req.session.user.id)
  res.json(await withAttachments(legalizacion))
})

legalizacionesRouter.get('/:id/export.pdf', async (req, res) => {
  const found = await legalizacionesRepo.getLegalizacion(req.params.id)
  if (!found) return res.status(404).json({ error: 'No encontrada' })
  const legalizacion = await withAttachments(found)
  const pdfStream = await renderLegalizacionPdf(legalizacion)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="legalizacion-${legalizacion.id}.pdf"`)
  pdfStream.pipe(res)
})

legalizacionesRouter.get('/:id/export.xlsx', async (req, res) => {
  const legalizacion = await legalizacionesRepo.getLegalizacion(req.params.id)
  if (!legalizacion) return res.status(404).json({ error: 'No encontrada' })
  const workbook = await buildLegalizacionWorkbook(legalizacion)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="legalizacion-${legalizacion.id}.xlsx"`)
  await workbook.xlsx.write(res)
  res.end()
})
