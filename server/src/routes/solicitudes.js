import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { renderSolicitudPdf } from '../export/pdf/solicitudTemplate.js'
import { buildSolicitudWorkbook } from '../export/excel/solicitudWorkbook.js'
import { listAttachments } from './attachments.js'
import { sendMailToRecipients } from '../lib/graphMail.js'

export const solicitudesRouter = Router()

solicitudesRouter.use(requireAuth)

const include = {
  project: { include: { businessUnit: true } },
  solicitante: true,
  vistoBuenoAprobador: true,
  vistoBuenoContable: true,
  vistoBuenoAdmin: true,
  rechazadoPor: true,
  items: true,
}

const EDITABLE_STATES = new Set(['PENDIENTE', 'RECHAZADA'])

async function withAttachments(solicitud) {
  const attachments = await listAttachments('SOLICITUD', solicitud.id)
  return { ...solicitud, attachments }
}

solicitudesRouter.get('/', async (req, res) => {
  const { tipo, mine, bandeja } = req.query
  const where = {}
  if (tipo) where.tipo = tipo
  if (mine === '1') where.solicitanteId = req.session.user.id
  if (bandeja === 'aprobador') {
    where.estado = 'PENDIENTE'
    where.vistoBuenoAprobadorId = null
  } else if (bandeja === 'contable') {
    where.estado = 'PENDIENTE'
    where.vistoBuenoAprobadorId = { not: null }
    where.vistoBuenoContableId = null
  } else if (bandeja === 'administrativo') {
    where.estado = 'PENDIENTE'
    where.vistoBuenoContableId = { not: null }
    where.vistoBuenoAdminId = null
  }

  const solicitudes = await prisma.solicitudRecurso.findMany({
    where,
    include,
    orderBy: { createdAt: 'desc' },
  })
  res.json(solicitudes)
})

solicitudesRouter.get('/:id', async (req, res) => {
  const solicitud = await prisma.solicitudRecurso.findUnique({
    where: { id: Number(req.params.id) },
    include,
  })
  if (!solicitud) return res.status(404).json({ error: 'No encontrada' })
  res.json(await withAttachments(solicitud))
})

function itemsData(items) {
  return items.map((item) => ({
    concepto: item.concepto,
    fechaInicio: new Date(item.fechaInicio),
    fechaFin: new Date(item.fechaFin),
    numeroEquipos: item.numeroEquipos ? Number(item.numeroEquipos) : null,
    valor: Number(item.valor),
  }))
}

solicitudesRouter.post('/', async (req, res) => {
  const {
    tipo, fecha, aFavorDe, nitCc, direccion, telefono, porConceptoDe,
    projectId, cuentaBancariaNo, entidadBancaria, aNombreDe, cedulaNitTitular, items, destinatarios,
  } = req.body

  if (!tipo || !fecha || !aFavorDe || !projectId || !items?.length) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const solicitud = await prisma.solicitudRecurso.create({
    data: {
      tipo,
      fecha: new Date(fecha),
      aFavorDe,
      nitCc,
      direccion,
      telefono,
      porConceptoDe,
      projectId: Number(projectId),
      cuentaBancariaNo,
      entidadBancaria,
      aNombreDe,
      cedulaNitTitular,
      destinatarios: destinatarios || null,
      solicitanteId: req.session.user.id,
      estado: 'PENDIENTE',
      items: { create: itemsData(items) },
    },
    include,
  })

  if (destinatarios) {
    sendMailToRecipients({
      to: destinatarios,
      subject: `Nueva solicitud de recursos No. ${solicitud.id} (${tipo})`,
      html: `<p>Se registró la solicitud No. ${solicitud.id} a favor de ${aFavorDe} por un total pendiente de revisión.</p>`,
    }).catch((err) => console.error('Error enviando correo de solicitud:', err.message))
  }

  res.status(201).json(await withAttachments(solicitud))
})

solicitudesRouter.put('/:id', async (req, res) => {
  const existing = await prisma.solicitudRecurso.findUnique({ where: { id: Number(req.params.id) } })
  if (!existing) return res.status(404).json({ error: 'No encontrada' })
  if (!EDITABLE_STATES.has(existing.estado)) {
    return res.status(409).json({ error: 'Esta solicitud ya fue aprobada y no se puede editar' })
  }
  const isOwner = existing.solicitanteId === req.session.user.id
  if (!isOwner && req.session.user.role !== 'ADMINISTRATIVO') {
    return res.status(403).json({ error: 'No autorizado para editar esta solicitud' })
  }

  const {
    fecha, aFavorDe, nitCc, direccion, telefono, porConceptoDe,
    projectId, cuentaBancariaNo, entidadBancaria, aNombreDe, cedulaNitTitular, items, destinatarios,
  } = req.body

  if (!fecha || !aFavorDe || !projectId || !items?.length) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  await prisma.conceptoItem.deleteMany({ where: { solicitudId: existing.id } })

  const solicitud = await prisma.solicitudRecurso.update({
    where: { id: existing.id },
    data: {
      fecha: new Date(fecha),
      aFavorDe,
      nitCc,
      direccion,
      telefono,
      porConceptoDe,
      projectId: Number(projectId),
      cuentaBancariaNo,
      entidadBancaria,
      aNombreDe,
      cedulaNitTitular,
      destinatarios: destinatarios || null,
      estado: 'PENDIENTE',
      vistoBuenoAprobadorId: null,
      vistoBuenoAprobadorAt: null,
      vistoBuenoContableId: null,
      vistoBuenoContableAt: null,
      vistoBuenoAdminId: null,
      vistoBuenoAdminAt: null,
      rechazadoPorId: null,
      rechazadoAt: null,
      comentarioRechazo: null,
      items: { create: itemsData(items) },
    },
    include,
  })
  res.json(await withAttachments(solicitud))
})

solicitudesRouter.post('/:id/visto-bueno-aprobador', requireRole('APROBADOR'), async (req, res) => {
  const existing = await prisma.solicitudRecurso.findUnique({ where: { id: Number(req.params.id) } })
  if (!existing || existing.estado !== 'PENDIENTE') return res.status(409).json({ error: 'La solicitud no está pendiente' })
  const solicitud = await prisma.solicitudRecurso.update({
    where: { id: existing.id },
    data: { vistoBuenoAprobadorId: req.session.user.id, vistoBuenoAprobadorAt: new Date() },
    include,
  })
  res.json(await withAttachments(solicitud))
})

solicitudesRouter.post('/:id/visto-bueno-contable', requireRole('CONTABLE'), async (req, res) => {
  const existing = await prisma.solicitudRecurso.findUnique({ where: { id: Number(req.params.id) } })
  if (!existing || existing.estado !== 'PENDIENTE') return res.status(409).json({ error: 'La solicitud no está pendiente' })
  if (!existing.vistoBuenoAprobadorId) return res.status(409).json({ error: 'Falta el visto bueno del aprobador' })
  const solicitud = await prisma.solicitudRecurso.update({
    where: { id: existing.id },
    data: { vistoBuenoContableId: req.session.user.id, vistoBuenoContableAt: new Date() },
    include,
  })
  res.json(await withAttachments(solicitud))
})

solicitudesRouter.post('/:id/visto-bueno-administrativo', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const existing = await prisma.solicitudRecurso.findUnique({ where: { id: Number(req.params.id) } })
  if (!existing || existing.estado !== 'PENDIENTE') return res.status(409).json({ error: 'La solicitud no está pendiente' })
  if (!existing.vistoBuenoContableId) return res.status(409).json({ error: 'Falta el visto bueno contable' })
  const solicitud = await prisma.solicitudRecurso.update({
    where: { id: existing.id },
    data: {
      vistoBuenoAdminId: req.session.user.id,
      vistoBuenoAdminAt: new Date(),
      estado: 'APROBADA',
    },
    include,
  })
  res.json(await withAttachments(solicitud))
})

solicitudesRouter.post('/:id/rechazar', requireRole('APROBADOR', 'CONTABLE', 'ADMINISTRATIVO'), async (req, res) => {
  const { comentario } = req.body
  const existing = await prisma.solicitudRecurso.findUnique({ where: { id: Number(req.params.id) } })
  if (!existing || existing.estado !== 'PENDIENTE') return res.status(409).json({ error: 'La solicitud no está pendiente' })

  const solicitud = await prisma.solicitudRecurso.update({
    where: { id: existing.id },
    data: {
      estado: 'RECHAZADA',
      rechazadoPorId: req.session.user.id,
      rechazadoAt: new Date(),
      comentarioRechazo: comentario || null,
    },
    include,
  })
  res.json(await withAttachments(solicitud))
})

solicitudesRouter.get('/:id/export.pdf', async (req, res) => {
  const solicitud = await prisma.solicitudRecurso.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!solicitud) return res.status(404).json({ error: 'No encontrada' })
  const pdfStream = await renderSolicitudPdf(solicitud)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="solicitud-${solicitud.id}.pdf"`)
  pdfStream.pipe(res)
})

solicitudesRouter.get('/:id/export.xlsx', async (req, res) => {
  const solicitud = await prisma.solicitudRecurso.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!solicitud) return res.status(404).json({ error: 'No encontrada' })
  const workbook = await buildSolicitudWorkbook(solicitud)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="solicitud-${solicitud.id}.xlsx"`)
  await workbook.xlsx.write(res)
  res.end()
})
