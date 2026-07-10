import { listRows, findRow, insertRow } from '../excelDb.js'
import { listUsers } from './users.js'

async function attachRelations(informe) {
  if (!informe) return null
  const [projects, businessUnits, users] = await Promise.all([
    listRows('Projects'),
    listRows('BusinessUnits'),
    listUsers(),
  ])
  const project = projects.find((p) => String(p.id) === String(informe.projectId)) ?? null
  const businessUnit = project ? businessUnits.find((bu) => String(bu.id) === String(project.businessUnitId)) ?? null : null
  const elaboradoPor = users.find((u) => String(u.id) === String(informe.elaboradoPorId)) ?? null

  return {
    ...informe,
    project: project ? { ...project, businessUnit } : null,
    elaboradoPor,
  }
}

export async function listInformesViaje() {
  const rows = await listRows('InformesViaje')
  const sorted = [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return Promise.all(sorted.map(attachRelations))
}

export async function getInformeViaje(id) {
  return attachRelations(await findRow('InformesViaje', id))
}

export async function createInformeViaje(data, elaboradoPorId) {
  const informe = await insertRow('InformesViaje', {
    fechaInicioViaje: new Date(data.fechaInicioViaje).toISOString(),
    duracionDias: Number(data.duracionDias),
    nombreSolicitante: data.nombreSolicitante,
    documentoIdentidad: data.documentoIdentidad,
    direccion: data.direccion,
    telefono: data.telefono,
    ciudad: data.ciudad,
    ruta: data.ruta,
    projectId: Number(data.projectId),
    tituloReferencia: data.tituloReferencia,
    objetoViaje: data.objetoViaje,
    descripcionActividad: data.descripcionActividad,
    destinatarios: data.destinatarios || null,
    elaboradoPorId,
    createdAt: new Date().toISOString(),
  })
  return getInformeViaje(informe.id)
}
