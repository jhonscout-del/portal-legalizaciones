import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { calcularRetefuente } from '../lib/retencion.js'
import { renderLegalizacionPdf } from '../export/pdf/legalizacionTemplate.js'
import { buildLegalizacionWorkbook } from '../export/excel/legalizacionWorkbook.js'
import { listAttachments } from './attachments.js'
import { sendMailToRecipients } from '../lib/graphMail.js'

export const legalizacionesRouter = Router()

legalizacionesRouter.use(requireAuth)

const include = {
  project: { include: { businessUnit: true } },
  solicitud: true,
  solicitante: true,
  firmaContablePor: true,
  rubros: true,
}

async function withResumen(legalizacion) {
  const legalizacionActual = legalizacion.rubros.reduce(
    (sum, r) => sum + (r.valorFactura - r.valorRetefuente),
    0,
  )

  const previas = await prisma.legalizacion.findMany({
    where: { solicitudId: legalizacion.solicitudId, id: { not: legalizacion.id }, createdAt: { lt: legalizacion.createdAt } },
    include: { rubros: true },
  })
  const legalizacionesAnteriores = previas.reduce(
    (sum, l) => sum + l.rubros.reduce((s, r) => s + (r.valorFactura - r.valorRetefuente), 0),
    0,
  )

  const saldo = legalizacion.valorAnticipo - legalizacionesAnteriores - legalizacionActual

  const attachments = await listAttachments('LEGALIZACION', legalizacion.id)

  return {
    ...legalizacion,
    attachments,
    resumen: {
      valorAnticipo: legalizacion.valorAnticipo,
      legalizacionesAnteriores,
      legalizacionActual,
      saldo,
      aReembolsar: saldo < 0,
    },
  }
}

legalizacionesRouter.get('/', async (req, res) => {
  const legalizaciones = await prisma.legalizacion.findMany({ include, orderBy: { createdAt: 'desc' } })
  res.json(await Promise.all(legalizaciones.map(withResumen)))
})

legalizacionesRouter.get('/:id', async (req, res) => {
  const legalizacion = await prisma.legalizacion.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!legalizacion) return res.status(404).json({ error: 'No encontrada' })
  res.json(await withResumen(legalizacion))
})

legalizacionesRouter.post('/', async (req, res) => {
  const { projectId, solicitudId, fechaSolicitudAnticipo, valorAnticipo, nitCc, nombreActividad, rubros, destinatarios } = req.body

  if (!projectId || !solicitudId || !rubros?.length) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const rates = await prisma.retentionRate.findMany()

  const legalizacion = await prisma.legalizacion.create({
    data: {
      projectId: Number(projectId),
      solicitudId: Number(solicitudId),
      fechaSolicitudAnticipo: new Date(fechaSolicitudAnticipo),
      valorAnticipo: Number(valorAnticipo),
      nitCc,
      nombreActividad,
      destinatarios: destinatarios || null,
      solicitanteId: req.session.user.id,
      rubros: {
        create: rubros.map((r) => {
          const valorFactura = Number(r.valorFactura)
          const valorRetefuente = r.valorRetefuente != null
            ? Number(r.valorRetefuente)
            : calcularRetefuente(r.concepto, valorFactura, rates)
          return {
            seccion: r.seccion,
            fecha: new Date(r.fecha),
            nit: r.nit,
            beneficiario: r.beneficiario,
            noFactura: r.noFactura,
            concepto: r.concepto,
            valorFactura,
            valorRetefuente,
          }
        }),
      },
    },
    include,
  })

  if (destinatarios) {
    sendMailToRecipients({
      to: destinatarios,
      subject: `Nueva legalización No. ${legalizacion.id}`,
      html: `<p>Se registró la legalización No. ${legalizacion.id} para la actividad "${nombreActividad}".</p>`,
    }).catch((err) => console.error('Error enviando correo de legalización:', err.message))
  }

  res.status(201).json(await withResumen(legalizacion))
})

legalizacionesRouter.post('/:id/firma-solicitante', async (req, res) => {
  const legalizacion = await prisma.legalizacion.update({
    where: { id: Number(req.params.id) },
    data: { firmaSolicitanteAt: new Date() },
    include,
  })
  res.json(await withResumen(legalizacion))
})

legalizacionesRouter.post('/:id/firma-contable', requireRole('CONTABLE'), async (req, res) => {
  const legalizacion = await prisma.legalizacion.update({
    where: { id: Number(req.params.id) },
    data: { firmaContablePorId: req.session.user.id, firmaContableAt: new Date() },
    include,
  })
  res.json(await withResumen(legalizacion))
})

legalizacionesRouter.get('/:id/export.pdf', async (req, res) => {
  const legalizacion = await prisma.legalizacion.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!legalizacion) return res.status(404).json({ error: 'No encontrada' })
  const withData = await withResumen(legalizacion)
  const pdfStream = await renderLegalizacionPdf(withData)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="legalizacion-${legalizacion.id}.pdf"`)
  pdfStream.pipe(res)
})

legalizacionesRouter.get('/:id/export.xlsx', async (req, res) => {
  const legalizacion = await prisma.legalizacion.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!legalizacion) return res.status(404).json({ error: 'No encontrada' })
  const withData = await withResumen(legalizacion)
  const workbook = await buildLegalizacionWorkbook(withData)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="legalizacion-${legalizacion.id}.xlsx"`)
  await workbook.xlsx.write(res)
  res.end()
})
