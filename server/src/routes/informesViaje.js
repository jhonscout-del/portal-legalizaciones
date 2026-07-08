import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { renderInformeViajePdf } from '../export/pdf/informeViajeTemplate.js'
import { buildInformeViajeWorkbook } from '../export/excel/informeViajeWorkbook.js'

export const informesViajeRouter = Router()

informesViajeRouter.use(requireAuth)

const include = {
  project: { include: { businessUnit: true } },
  elaboradoPor: true,
}

informesViajeRouter.get('/', async (req, res) => {
  const informes = await prisma.informeViaje.findMany({ include, orderBy: { createdAt: 'desc' } })
  res.json(informes)
})

informesViajeRouter.get('/:id', async (req, res) => {
  const informe = await prisma.informeViaje.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!informe) return res.status(404).json({ error: 'No encontrado' })
  res.json(informe)
})

informesViajeRouter.post('/', async (req, res) => {
  const {
    fechaInicioViaje, duracionDias, nombreSolicitante, documentoIdentidad,
    direccion, telefono, ciudad, ruta, projectId, tituloReferencia, objetoViaje, descripcionActividad,
  } = req.body

  if (!fechaInicioViaje || !nombreSolicitante || !projectId || !descripcionActividad) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const informe = await prisma.informeViaje.create({
    data: {
      fechaInicioViaje: new Date(fechaInicioViaje),
      duracionDias: Number(duracionDias),
      nombreSolicitante,
      documentoIdentidad,
      direccion,
      telefono,
      ciudad,
      ruta,
      projectId: Number(projectId),
      tituloReferencia,
      objetoViaje,
      descripcionActividad,
      elaboradoPorId: req.session.user.id,
    },
    include,
  })
  res.status(201).json(informe)
})

informesViajeRouter.get('/:id/export.pdf', async (req, res) => {
  const informe = await prisma.informeViaje.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!informe) return res.status(404).json({ error: 'No encontrado' })
  const pdfStream = await renderInformeViajePdf(informe)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="informe-viaje-${informe.id}.pdf"`)
  pdfStream.pipe(res)
})

informesViajeRouter.get('/:id/export.xlsx', async (req, res) => {
  const informe = await prisma.informeViaje.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!informe) return res.status(404).json({ error: 'No encontrado' })
  const workbook = await buildInformeViajeWorkbook(informe)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="informe-viaje-${informe.id}.xlsx"`)
  await workbook.xlsx.write(res)
  res.end()
})
