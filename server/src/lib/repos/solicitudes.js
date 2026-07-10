import { listRows, findRow, findRows, insertRow, updateRow, deleteRow } from '../excelDb.js'
import { listUsers } from './users.js'

export const EDITABLE_STATES = new Set(['PENDIENTE', 'RECHAZADA'])

async function attachRelations(solicitud) {
  if (!solicitud) return null
  const [projects, businessUnits, users, items] = await Promise.all([
    listRows('Projects'),
    listRows('BusinessUnits'),
    listUsers(),
    findRows('ConceptoItems', (i) => Number(i.solicitudId) === Number(solicitud.id)),
  ])
  const usersById = new Map(users.map((u) => [String(u.id), u]))
  const project = projects.find((p) => String(p.id) === String(solicitud.projectId)) ?? null
  const businessUnit = project ? businessUnits.find((bu) => String(bu.id) === String(project.businessUnitId)) ?? null : null
  const byId = (fk) => (fk ? usersById.get(String(fk)) ?? null : null)

  return {
    ...solicitud,
    project: project ? { ...project, businessUnit } : null,
    solicitante: byId(solicitud.solicitanteId),
    vistoBuenoAprobador: byId(solicitud.vistoBuenoAprobadorId),
    vistoBuenoContable: byId(solicitud.vistoBuenoContableId),
    vistoBuenoAdmin: byId(solicitud.vistoBuenoAdminId),
    rechazadoPor: byId(solicitud.rechazadoPorId),
    items,
  }
}

function itemsData(items) {
  return items.map((item) => ({
    concepto: item.concepto,
    fechaInicio: new Date(item.fechaInicio).toISOString(),
    fechaFin: new Date(item.fechaFin).toISOString(),
    numeroEquipos: item.numeroEquipos ? Number(item.numeroEquipos) : null,
    valor: Number(item.valor),
  }))
}

export async function listSolicitudes({ tipo, mine, bandeja, userId } = {}) {
  let rows = await listRows('SolicitudesRecurso')
  if (tipo) rows = rows.filter((s) => s.tipo === tipo)
  if (mine) rows = rows.filter((s) => Number(s.solicitanteId) === Number(userId))
  if (bandeja === 'aprobador') {
    rows = rows.filter((s) => s.estado === 'PENDIENTE' && !s.vistoBuenoAprobadorId)
  } else if (bandeja === 'contable') {
    rows = rows.filter((s) => s.estado === 'PENDIENTE' && s.vistoBuenoAprobadorId && !s.vistoBuenoContableId)
  } else if (bandeja === 'administrativo') {
    rows = rows.filter((s) => s.estado === 'PENDIENTE' && s.vistoBuenoContableId && !s.vistoBuenoAdminId)
  }
  rows = [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return Promise.all(rows.map(attachRelations))
}

export async function getRawSolicitud(id) {
  return findRow('SolicitudesRecurso', id)
}

export async function getSolicitud(id) {
  return attachRelations(await findRow('SolicitudesRecurso', id))
}

export async function createSolicitud(data, items, solicitanteId) {
  const solicitud = await insertRow('SolicitudesRecurso', {
    tipo: data.tipo,
    fecha: new Date(data.fecha).toISOString(),
    aFavorDe: data.aFavorDe,
    nitCc: data.nitCc,
    direccion: data.direccion,
    telefono: data.telefono,
    porConceptoDe: data.porConceptoDe,
    projectId: Number(data.projectId),
    cuentaBancariaNo: data.cuentaBancariaNo,
    entidadBancaria: data.entidadBancaria,
    aNombreDe: data.aNombreDe,
    cedulaNitTitular: data.cedulaNitTitular,
    destinatarios: data.destinatarios || null,
    solicitanteId,
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
    createdAt: new Date().toISOString(),
  })

  for (const item of itemsData(items)) {
    await insertRow('ConceptoItems', { ...item, solicitudId: solicitud.id })
  }

  return getSolicitud(solicitud.id)
}

export async function updateSolicitud(id, data, items) {
  // Se insertan los items nuevos primero y los viejos se borran al final:
  // si algo falla a mitad de camino, quedan filas duplicadas recuperables
  // en vez de una solicitud sin ítems.
  const insertedIds = []
  for (const item of itemsData(items)) {
    const inserted = await insertRow('ConceptoItems', { ...item, solicitudId: Number(id) })
    insertedIds.push(inserted.id)
  }

  const updated = await updateRow('SolicitudesRecurso', id, {
    fecha: new Date(data.fecha).toISOString(),
    aFavorDe: data.aFavorDe,
    nitCc: data.nitCc,
    direccion: data.direccion,
    telefono: data.telefono,
    porConceptoDe: data.porConceptoDe,
    projectId: Number(data.projectId),
    cuentaBancariaNo: data.cuentaBancariaNo,
    entidadBancaria: data.entidadBancaria,
    aNombreDe: data.aNombreDe,
    cedulaNitTitular: data.cedulaNitTitular,
    destinatarios: data.destinatarios || null,
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
  })

  const allItems = await findRows('ConceptoItems', (i) => Number(i.solicitudId) === Number(id))
  const oldItems = allItems.filter((i) => !insertedIds.includes(i.id))
  for (const old of oldItems) {
    await deleteRow('ConceptoItems', old.id)
  }

  return getSolicitud(updated.id)
}

export async function setVistoBuenoAprobador(id, userId) {
  await updateRow('SolicitudesRecurso', id, {
    vistoBuenoAprobadorId: userId,
    vistoBuenoAprobadorAt: new Date().toISOString(),
  })
  return getSolicitud(id)
}

export async function setVistoBuenoContable(id, userId) {
  await updateRow('SolicitudesRecurso', id, {
    vistoBuenoContableId: userId,
    vistoBuenoContableAt: new Date().toISOString(),
  })
  return getSolicitud(id)
}

export async function setVistoBuenoAdministrativo(id, userId) {
  await updateRow('SolicitudesRecurso', id, {
    vistoBuenoAdminId: userId,
    vistoBuenoAdminAt: new Date().toISOString(),
    estado: 'APROBADA',
  })
  return getSolicitud(id)
}

export async function rechazarSolicitud(id, userId, comentario) {
  await updateRow('SolicitudesRecurso', id, {
    estado: 'RECHAZADA',
    rechazadoPorId: userId,
    rechazadoAt: new Date().toISOString(),
    comentarioRechazo: comentario || null,
  })
  return getSolicitud(id)
}
