import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { renderSolicitudPdf } from '../export/pdf/solicitudTemplate.js'
import { buildSolicitudWorkbook } from '../export/excel/solicitudWorkbook.js'
import { buildSolicitudesReporte } from '../export/excel/reportes.js'
import { listAttachments } from '../lib/repos/attachments.js'
import { sendMailToRecipients, notifyRoleHolders, resolveSenderUpn } from '../lib/graphMail.js'
import * as solicitudesRepo from '../lib/repos/solicitudes.js'

export const solicitudesRouter = Router()

solicitudesRouter.use(requireAuth)

async function withAttachments(solicitud) {
  const attachments = await listAttachments('SOLICITUD', solicitud.id)
  return { ...solicitud, attachments }
}

solicitudesRouter.get('/', async (req, res) => {
  const { tipo, mine, bandeja } = req.query
  const solicitudes = await solicitudesRepo.listSolicitudes({
    tipo,
    mine: mine === '1',
    bandeja,
    userId: req.session.user.id,
  })
  res.json(solicitudes)
})

// Debe ir antes de '/:id' — si no, Express interpreta "reporte.xlsx" como un id.
solicitudesRouter.get('/reporte.xlsx', async (req, res) => {
  const { tipo, mine } = req.query
  const solicitudes = await solicitudesRepo.listSolicitudes({
    tipo,
    mine: mine === '1',
    userId: req.session.user.id,
  })
  const workbook = buildSolicitudesReporte(solicitudes)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-solicitudes.xlsx"')
  await workbook.xlsx.write(res)
  res.end()
})

solicitudesRouter.get('/:id', async (req, res) => {
  const solicitud = await solicitudesRepo.getSolicitud(req.params.id)
  if (!solicitud) return res.status(404).json({ error: 'No encontrada' })
  res.json(await withAttachments(solicitud))
})

solicitudesRouter.post('/', async (req, res) => {
  const {
    tipo, fecha, aFavorDe, nitCc, direccion, telefono, porConceptoDe,
    projectId, cuentaBancariaNo, entidadBancaria, aNombreDe, cedulaNitTitular, items, destinatarios,
  } = req.body

  if (!tipo || !fecha || !aFavorDe || !projectId || !items?.length) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const solicitud = await solicitudesRepo.createSolicitud(
    { tipo, fecha, aFavorDe, nitCc, direccion, telefono, porConceptoDe, projectId, cuentaBancariaNo, entidadBancaria, aNombreDe, cedulaNitTitular, destinatarios },
    items,
    req.session.user.id,
  )

  if (destinatarios) {
    sendMailToRecipients({
      to: destinatarios,
      subject: `Nueva solicitud de recursos No. ${solicitud.id} (${tipo})`,
      html: `<p>Se registró la solicitud No. ${solicitud.id} a favor de ${aFavorDe} por un total pendiente de revisión.</p>`,
      senderUpn: resolveSenderUpn(req.session.user),
    }).catch((err) => console.error('Error enviando correo de solicitud:', err.message))
  }

  res.status(201).json(await withAttachments(solicitud))
})

solicitudesRouter.put('/:id', async (req, res) => {
  const existing = await solicitudesRepo.getRawSolicitud(req.params.id)
  if (!existing) return res.status(404).json({ error: 'No encontrada' })
  if (!solicitudesRepo.EDITABLE_STATES.has(existing.estado)) {
    return res.status(409).json({ error: 'Esta solicitud ya fue aprobada y no se puede editar' })
  }
  const isOwner = Number(existing.solicitanteId) === req.session.user.id
  if (!isOwner && !req.session.user.roles.includes('ADMINISTRATIVO')) {
    return res.status(403).json({ error: 'No autorizado para editar esta solicitud' })
  }

  const {
    fecha, aFavorDe, nitCc, direccion, telefono, porConceptoDe,
    projectId, cuentaBancariaNo, entidadBancaria, aNombreDe, cedulaNitTitular, items, destinatarios,
  } = req.body

  if (!fecha || !aFavorDe || !projectId || !items?.length) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const solicitud = await solicitudesRepo.updateSolicitud(
    existing.id,
    { fecha, aFavorDe, nitCc, direccion, telefono, porConceptoDe, projectId, cuentaBancariaNo, entidadBancaria, aNombreDe, cedulaNitTitular, destinatarios },
    items,
  )
  res.json(await withAttachments(solicitud))
})

function notifySolicitante(solicitud, subject, html, senderUpn) {
  if (!solicitud.solicitante?.email) return
  sendMailToRecipients({ to: solicitud.solicitante.email, subject, html, senderUpn })
    .catch((err) => console.error('Error notificando al solicitante:', err.message))
}

solicitudesRouter.post('/:id/visto-bueno-aprobador', requireRole('APROBADOR'), async (req, res) => {
  const existing = await solicitudesRepo.getRawSolicitud(req.params.id)
  if (!existing || existing.estado !== 'PENDIENTE') return res.status(409).json({ error: 'La solicitud no está pendiente' })
  const solicitud = await solicitudesRepo.setVistoBuenoAprobador(existing.id, req.session.user.id)

  const senderUpn = resolveSenderUpn(req.session.user)
  notifySolicitante(
    solicitud,
    `Solicitud No. ${solicitud.id}: visto bueno del aprobador`,
    `<p>Tu solicitud No. ${solicitud.id} recibió el visto bueno del aprobador y pasó a revisión de Contabilidad.</p>`,
    senderUpn,
  )
  notifyRoleHolders('CONTABLE', {
    subject: `Solicitud No. ${solicitud.id} pendiente de revisión contable`,
    html: `<p>La solicitud No. ${solicitud.id} de ${solicitud.solicitante?.name ?? ''} está pendiente de tu visto bueno.</p>`,
    senderUpn,
  }).catch((err) => console.error('Error notificando a Contabilidad:', err.message))

  res.json(await withAttachments(solicitud))
})

solicitudesRouter.post('/:id/visto-bueno-contable', requireRole('CONTABLE'), async (req, res) => {
  const existing = await solicitudesRepo.getRawSolicitud(req.params.id)
  if (!existing || existing.estado !== 'PENDIENTE') return res.status(409).json({ error: 'La solicitud no está pendiente' })
  if (!existing.vistoBuenoAprobadorId) return res.status(409).json({ error: 'Falta el visto bueno del aprobador' })
  const solicitud = await solicitudesRepo.setVistoBuenoContable(existing.id, req.session.user.id)

  const senderUpn = resolveSenderUpn(req.session.user)
  notifySolicitante(
    solicitud,
    `Solicitud No. ${solicitud.id}: visto bueno contable`,
    `<p>Tu solicitud No. ${solicitud.id} recibió el visto bueno de Contabilidad y pasó a revisión Administrativa.</p>`,
    senderUpn,
  )
  notifyRoleHolders('ADMINISTRATIVO', {
    subject: `Solicitud No. ${solicitud.id} pendiente de revisión administrativa`,
    html: `<p>La solicitud No. ${solicitud.id} de ${solicitud.solicitante?.name ?? ''} está pendiente de tu visto bueno.</p>`,
    senderUpn,
  }).catch((err) => console.error('Error notificando a Administrativo:', err.message))

  res.json(await withAttachments(solicitud))
})

solicitudesRouter.post('/:id/visto-bueno-administrativo', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const existing = await solicitudesRepo.getRawSolicitud(req.params.id)
  if (!existing || existing.estado !== 'PENDIENTE') return res.status(409).json({ error: 'La solicitud no está pendiente' })
  if (!existing.vistoBuenoContableId) return res.status(409).json({ error: 'Falta el visto bueno contable' })
  const solicitud = await solicitudesRepo.setVistoBuenoAdministrativo(existing.id, req.session.user.id)

  const senderUpn = resolveSenderUpn(req.session.user)
  notifySolicitante(
    solicitud,
    `Solicitud No. ${solicitud.id} aprobada`,
    `<p>Tu solicitud No. ${solicitud.id} fue aprobada en su totalidad.</p>`,
    senderUpn,
  )
  if (solicitud.destinatarios) {
    sendMailToRecipients({
      to: solicitud.destinatarios,
      subject: `Solicitud No. ${solicitud.id} aprobada`,
      html: `<p>La solicitud No. ${solicitud.id} a favor de ${solicitud.aFavorDe} fue aprobada en su totalidad.</p>`,
      senderUpn,
    }).catch((err) => console.error('Error notificando destinatarios:', err.message))
  }

  res.json(await withAttachments(solicitud))
})

solicitudesRouter.post('/:id/rechazar', requireRole('APROBADOR', 'CONTABLE', 'ADMINISTRATIVO'), async (req, res) => {
  const { comentario } = req.body
  const existing = await solicitudesRepo.getRawSolicitud(req.params.id)
  if (!existing || existing.estado !== 'PENDIENTE') return res.status(409).json({ error: 'La solicitud no está pendiente' })

  const solicitud = await solicitudesRepo.rechazarSolicitud(existing.id, req.session.user.id, comentario)

  const senderUpn = resolveSenderUpn(req.session.user)
  notifySolicitante(
    solicitud,
    `Solicitud No. ${solicitud.id} rechazada`,
    `<p>Tu solicitud No. ${solicitud.id} fue rechazada por ${solicitud.rechazadoPor?.name ?? ''}.</p>${comentario ? `<p>Motivo: "${comentario}"</p>` : ''}`,
    senderUpn,
  )
  if (solicitud.destinatarios) {
    sendMailToRecipients({
      to: solicitud.destinatarios,
      subject: `Solicitud No. ${solicitud.id} rechazada`,
      html: `<p>La solicitud No. ${solicitud.id} a favor de ${solicitud.aFavorDe} fue rechazada.</p>${comentario ? `<p>Motivo: "${comentario}"</p>` : ''}`,
      senderUpn,
    }).catch((err) => console.error('Error notificando destinatarios:', err.message))
  }

  res.json(await withAttachments(solicitud))
})

solicitudesRouter.get('/:id/export.pdf', async (req, res) => {
  const found = await solicitudesRepo.getSolicitud(req.params.id)
  if (!found) return res.status(404).json({ error: 'No encontrada' })
  const solicitud = await withAttachments(found)
  const pdfStream = await renderSolicitudPdf(solicitud)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="solicitud-${solicitud.id}.pdf"`)
  pdfStream.pipe(res)
})

solicitudesRouter.get('/:id/export.xlsx', async (req, res) => {
  const solicitud = await solicitudesRepo.getSolicitud(req.params.id)
  if (!solicitud) return res.status(404).json({ error: 'No encontrada' })
  const workbook = await buildSolicitudWorkbook(solicitud)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="solicitud-${solicitud.id}.xlsx"`)
  await workbook.xlsx.write(res)
  res.end()
})
