import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { renderInformeViajePdf } from '../export/pdf/informeViajeTemplate.js'
import { buildInformeViajeWorkbook } from '../export/excel/informeViajeWorkbook.js'
import { listAttachments } from '../lib/repos/attachments.js'
import { sendMailToRecipients } from '../lib/graphMail.js'
import * as informesViajeRepo from '../lib/repos/informesViaje.js'

export const informesViajeRouter = Router()

informesViajeRouter.use(requireAuth)

async function withAttachments(informe) {
  const attachments = await listAttachments('INFORME_VIAJE', informe.id)
  return { ...informe, attachments }
}

informesViajeRouter.get('/', async (req, res) => {
  res.json(await informesViajeRepo.listInformesViaje())
})

informesViajeRouter.get('/:id', async (req, res) => {
  const informe = await informesViajeRepo.getInformeViaje(req.params.id)
  if (!informe) return res.status(404).json({ error: 'No encontrado' })
  res.json(await withAttachments(informe))
})

informesViajeRouter.post('/', async (req, res) => {
  const {
    fechaInicioViaje, duracionDias, nombreSolicitante, documentoIdentidad,
    direccion, telefono, ciudad, ruta, projectId, tituloReferencia, objetoViaje, descripcionActividad,
    destinatarios,
  } = req.body

  if (!fechaInicioViaje || !nombreSolicitante || !projectId || !descripcionActividad) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const informe = await informesViajeRepo.createInformeViaje(
    { fechaInicioViaje, duracionDias, nombreSolicitante, documentoIdentidad, direccion, telefono, ciudad, ruta, projectId, tituloReferencia, objetoViaje, descripcionActividad, destinatarios },
    req.session.user.id,
  )

  if (destinatarios) {
    sendMailToRecipients({
      to: destinatarios,
      subject: `Nuevo informe de viaje No. ${informe.id}`,
      html: `<p>Se registró el informe de viaje No. ${informe.id} de ${nombreSolicitante}.</p>`,
    }).catch((err) => console.error('Error enviando correo de informe de viaje:', err.message))
  }

  res.status(201).json(await withAttachments(informe))
})

informesViajeRouter.get('/:id/export.pdf', async (req, res) => {
  const found = await informesViajeRepo.getInformeViaje(req.params.id)
  if (!found) return res.status(404).json({ error: 'No encontrado' })
  const informe = await withAttachments(found)
  const pdfStream = await renderInformeViajePdf(informe)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="informe-viaje-${informe.id}.pdf"`)
  pdfStream.pipe(res)
})

informesViajeRouter.get('/:id/export.xlsx', async (req, res) => {
  const informe = await informesViajeRepo.getInformeViaje(req.params.id)
  if (!informe) return res.status(404).json({ error: 'No encontrado' })
  const workbook = await buildInformeViajeWorkbook(informe)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="informe-viaje-${informe.id}.xlsx"`)
  await workbook.xlsx.write(res)
  res.end()
})
