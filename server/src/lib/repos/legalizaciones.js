import { listRows, findRow, findRows, insertRow, updateRow } from '../excelDb.js'
import { calcularRetefuente } from '../retencion.js'
import { listUsers } from './users.js'

async function attachRelations(legalizacion) {
  if (!legalizacion) return null
  const [projects, businessUnits, solicitudes, users, rubros] = await Promise.all([
    listRows('Projects'),
    listRows('BusinessUnits'),
    listRows('SolicitudesRecurso'),
    listUsers(),
    findRows('RubrosLegalizacion', (r) => Number(r.legalizacionId) === Number(legalizacion.id)),
  ])
  const usersById = new Map(users.map((u) => [String(u.id), u]))
  const project = projects.find((p) => String(p.id) === String(legalizacion.projectId)) ?? null
  const businessUnit = project ? businessUnits.find((bu) => String(bu.id) === String(project.businessUnitId)) ?? null : null
  const byId = (fk) => (fk ? usersById.get(String(fk)) ?? null : null)

  return {
    ...legalizacion,
    project: project ? { ...project, businessUnit } : null,
    solicitud: solicitudes.find((s) => String(s.id) === String(legalizacion.solicitudId)) ?? null,
    solicitante: byId(legalizacion.solicitanteId),
    vistoBuenoAprobador: byId(legalizacion.vistoBuenoAprobadorId),
    firmaContablePor: byId(legalizacion.firmaContablePorId),
    rubros,
  }
}

function rubroTotal(rubro) {
  return rubro.valorFactura - rubro.valorRetefuente
}

export async function withResumen(legalizacion) {
  const legalizacionActual = legalizacion.rubros.reduce((sum, r) => sum + rubroTotal(r), 0)

  const otrasLegalizaciones = await findRows(
    'Legalizaciones',
    (l) => Number(l.solicitudId) === Number(legalizacion.solicitudId) && Number(l.id) !== Number(legalizacion.id)
      && new Date(l.createdAt) < new Date(legalizacion.createdAt),
  )
  const rubrosPorLegalizacion = await Promise.all(
    otrasLegalizaciones.map((l) => findRows('RubrosLegalizacion', (r) => Number(r.legalizacionId) === Number(l.id))),
  )
  const legalizacionesAnteriores = rubrosPorLegalizacion.reduce(
    (sum, rubros) => sum + rubros.reduce((s, r) => s + rubroTotal(r), 0),
    0,
  )

  const saldo = legalizacion.valorAnticipo - legalizacionesAnteriores - legalizacionActual

  return {
    ...legalizacion,
    resumen: {
      valorAnticipo: legalizacion.valorAnticipo,
      legalizacionesAnteriores,
      legalizacionActual,
      saldo,
      aReembolsar: saldo < 0,
    },
  }
}

export async function listLegalizaciones({ bandeja } = {}) {
  let rows = await listRows('Legalizaciones')
  if (bandeja === 'aprobador') {
    rows = rows.filter((l) => !l.vistoBuenoAprobadorId)
  } else if (bandeja === 'contable') {
    rows = rows.filter((l) => l.vistoBuenoAprobadorId && !l.firmaContableAt)
  }
  const sorted = [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const joined = await Promise.all(sorted.map(attachRelations))
  return Promise.all(joined.map(withResumen))
}

export async function getRawLegalizacion(id) {
  return findRow('Legalizaciones', id)
}

export async function getLegalizacion(id) {
  const legalizacion = await attachRelations(await findRow('Legalizaciones', id))
  if (!legalizacion) return null
  return withResumen(legalizacion)
}

export async function createLegalizacion(data, rubros, solicitanteId) {
  const rates = await listRows('RetentionRates')

  const legalizacion = await insertRow('Legalizaciones', {
    projectId: Number(data.projectId),
    solicitudId: Number(data.solicitudId),
    fechaSolicitudAnticipo: new Date(data.fechaSolicitudAnticipo).toISOString(),
    valorAnticipo: Number(data.valorAnticipo),
    nitCc: data.nitCc,
    nombreActividad: data.nombreActividad,
    destinatarios: data.destinatarios || null,
    solicitanteId,
    firmaSolicitanteAt: null,
    firmaContablePorId: null,
    firmaContableAt: null,
    createdAt: new Date().toISOString(),
    vistoBuenoAprobadorId: null,
    vistoBuenoAprobadorAt: null,
  })

  for (const r of rubros) {
    const valorFactura = Number(r.valorFactura)
    const valorRetefuente = r.valorRetefuente != null ? Number(r.valorRetefuente) : calcularRetefuente(r.concepto, valorFactura, rates)
    await insertRow('RubrosLegalizacion', {
      legalizacionId: legalizacion.id,
      seccion: r.seccion,
      fecha: new Date(r.fecha).toISOString(),
      nit: r.nit,
      beneficiario: r.beneficiario,
      noFactura: r.noFactura,
      concepto: r.concepto,
      valorFactura,
      valorRetefuente,
    })
  }

  return getLegalizacion(legalizacion.id)
}

export async function setVistoBuenoAprobador(id, userId) {
  await updateRow('Legalizaciones', id, {
    vistoBuenoAprobadorId: userId,
    vistoBuenoAprobadorAt: new Date().toISOString(),
  })
  return getLegalizacion(id)
}

export async function setFirmaSolicitante(id) {
  await updateRow('Legalizaciones', id, { firmaSolicitanteAt: new Date().toISOString() })
  return getLegalizacion(id)
}

export async function setFirmaContable(id, userId) {
  await updateRow('Legalizaciones', id, {
    firmaContablePorId: userId,
    firmaContableAt: new Date().toISOString(),
  })
  return getLegalizacion(id)
}
