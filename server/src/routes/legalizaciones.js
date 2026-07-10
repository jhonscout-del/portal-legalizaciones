import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { renderLegalizacionPdf } from '../export/pdf/legalizacionTemplate.js'
import { buildLegalizacionWorkbook } from '../export/excel/legalizacionWorkbook.js'
import { buildLegalizacionesReporte } from '../export/excel/reportes.js'
import { listAttachments } from '../lib/repos/attachments.js'
import { sendMailToRecipients, notifyRoleHolders, resolveSenderUpn } from '../lib/graphMail.js'
import * as legalizacionesRepo from '../lib/repos/legalizaciones.js'

export const legalizacionesRouter = Router()

legalizacionesRouter.use(requireAuth)

async function withAttachments(legalizacion) {
  const attachments = await listAttachments('LEGALIZACION', legalizacion.id)
  return { ...legalizacion, attachments }
}

legalizacionesRouter.get('/', async (req, res) => {
  const legalizaciones = await legalizacionesRepo.listLegalizaciones({ bandeja: req.query.bandeja })
  res.json(await Promise.all(legalizaciones.map(withAttachments)))
})

// Debe ir antes de '/:id' — si no, Express interpreta "reporte.xlsx" como un id.
legalizacionesRouter.get('/reporte.xlsx', async (req, res) => {
  const legalizaciones = await legalizacionesRepo.listLegalizaciones()
  const workbook = buildLegalizacionesReporte(legalizaciones)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-legalizaciones.xlsx"')
  await workbook.xlsx.write(res)
  res.end()
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

// Notifica a quien debe revisar la legalización en Contabilidad: si el
// proyecto tiene un responsable asignado (Proyectos y Unidades de Negocio),
// se le notifica solo a él; si no, se notifica a todos los usuarios con rol
// Contabilidad.
function notifyContable(legalizacion, senderUpn) {
  const subject = `Legalización No. ${legalizacion.id} lista para revisión contable`
  const html = `<p>La legalización No. ${legalizacion.id} ("${legalizacion.nombreActividad}") de ${legalizacion.solicitante?.name ?? ''} está pendiente de tu visto bueno.</p>`
  const responsableEmail = legalizacion.project?.responsableEmail
  const promise = responsableEmail
    ? sendMailToRecipients({ to: responsableEmail, subject, html, senderUpn })
    : notifyRoleHolders('CONTABLE', { subject, html, senderUpn })
  promise.catch((err) => console.error('Error notificando a Contabilidad:', err.message))
}

legalizacionesRouter.post('/:id/firma-solicitante', async (req, res) => {
  const legalizacion = await legalizacionesRepo.setFirmaSolicitante(req.params.id)
  res.json(await withAttachments(legalizacion))
})

legalizacionesRouter.post('/:id/visto-bueno-aprobador', requireRole('APROBADOR'), async (req, res) => {
  const existing = await legalizacionesRepo.getRawLegalizacion(req.params.id)
  if (!existing) return res.status(404).json({ error: 'No encontrada' })
  if (existing.vistoBuenoAprobadorId) return res.status(409).json({ error: 'Ya tiene el visto bueno del aprobador' })

  const legalizacion = await legalizacionesRepo.setVistoBuenoAprobador(req.params.id, req.session.user.id)
  const senderUpn = resolveSenderUpn(req.session.user)

  if (legalizacion.solicitante?.email) {
    sendMailToRecipients({
      to: legalizacion.solicitante.email,
      subject: `Legalización No. ${legalizacion.id}: visto bueno del aprobador`,
      html: `<p>Tu legalización No. ${legalizacion.id} ("${legalizacion.nombreActividad}") recibió el visto bueno del aprobador y ya puede enviarse a Contabilidad.</p>`,
      senderUpn,
    }).catch((err) => console.error('Error notificando al solicitante:', err.message))
  }
  notifyContable(legalizacion, senderUpn)

  res.json(await withAttachments(legalizacion))
})

legalizacionesRouter.post('/:id/firma-contable', requireRole('CONTABLE'), async (req, res) => {
  const existing = await legalizacionesRepo.getRawLegalizacion(req.params.id)
  if (!existing) return res.status(404).json({ error: 'No encontrada' })
  if (!existing.vistoBuenoAprobadorId) {
    return res.status(409).json({ error: 'Falta el visto bueno del aprobador antes de poder firmar por Contabilidad' })
  }

  const legalizacion = await legalizacionesRepo.setFirmaContable(req.params.id, req.session.user.id)

  if (legalizacion.solicitante?.email) {
    sendMailToRecipients({
      to: legalizacion.solicitante.email,
      subject: `Legalización No. ${legalizacion.id}: firmada por Contabilidad`,
      html: `<p>Tu legalización No. ${legalizacion.id} ("${legalizacion.nombreActividad}") fue firmada por Contabilidad.</p>`,
      senderUpn: resolveSenderUpn(req.session.user),
    }).catch((err) => console.error('Error notificando al solicitante:', err.message))
  }

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
