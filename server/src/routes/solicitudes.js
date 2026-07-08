import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { renderSolicitudPdf } from '../export/pdf/solicitudTemplate.js'
import { buildSolicitudWorkbook } from '../export/excel/solicitudWorkbook.js'

export const solicitudesRouter = Router()

solicitudesRouter.use(requireAuth)

const include = {
  project: { include: { businessUnit: true } },
  solicitante: true,
  vistoBuenoContable: true,
  vistoBuenoAdmin: true,
  items: true,
}

solicitudesRouter.get('/', async (req, res) => {
  const { tipo } = req.query
  const solicitudes = await prisma.solicitudRecurso.findMany({
    where: tipo ? { tipo } : undefined,
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
  res.json(solicitud)
})

solicitudesRouter.post('/', async (req, res) => {
  const {
    tipo, fecha, aFavorDe, nitCc, direccion, telefono, porConceptoDe,
    projectId, cuentaBancariaNo, entidadBancaria, aNombreDe, cedulaNitTitular, items,
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
      solicitanteId: req.session.user.id,
      estado: 'PENDIENTE',
      items: {
        create: items.map((item) => ({
          concepto: item.concepto,
          fechaInicio: new Date(item.fechaInicio),
          fechaFin: new Date(item.fechaFin),
          numeroEquipos: item.numeroEquipos ? Number(item.numeroEquipos) : null,
          valor: Number(item.valor),
        })),
      },
    },
    include,
  })
  res.status(201).json(solicitud)
})

solicitudesRouter.post('/:id/visto-bueno-contable', requireRole('CONTABLE'), async (req, res) => {
  const solicitud = await prisma.solicitudRecurso.update({
    where: { id: Number(req.params.id) },
    data: { vistoBuenoContableId: req.session.user.id, vistoBuenoContableAt: new Date() },
    include,
  })
  res.json(solicitud)
})

solicitudesRouter.post('/:id/visto-bueno-administrativo', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const solicitud = await prisma.solicitudRecurso.update({
    where: { id: Number(req.params.id) },
    data: {
      vistoBuenoAdminId: req.session.user.id,
      vistoBuenoAdminAt: new Date(),
      estado: 'APROBADA',
    },
    include,
  })
  res.json(solicitud)
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
