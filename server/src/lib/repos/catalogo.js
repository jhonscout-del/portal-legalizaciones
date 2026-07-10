import { listRows, findRow, insertRow, updateRow } from '../excelDb.js'

export async function listBusinessUnits() {
  const rows = await listRows('BusinessUnits')
  return [...rows].sort((a, b) => String(a.code).localeCompare(String(b.code)))
}

export async function createBusinessUnit({ code, name, donor, active }) {
  return insertRow('BusinessUnits', { code, name, donor, active: active ?? true })
}

export async function updateBusinessUnit(id, { code, name, donor, active }) {
  return updateRow('BusinessUnits', id, { code, name, donor, active })
}

async function attachBusinessUnit(project) {
  if (!project) return null
  const businessUnit = await findRow('BusinessUnits', project.businessUnitId)
  return { ...project, businessUnit }
}

export async function listProjects() {
  const [projects, businessUnits] = await Promise.all([listRows('Projects'), listRows('BusinessUnits')])
  const buById = new Map(businessUnits.map((bu) => [String(bu.id), bu]))
  return projects
    .map((p) => ({ ...p, businessUnit: buById.get(String(p.businessUnitId)) ?? null }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
}

export async function getProject(id) {
  return attachBusinessUnit(await findRow('Projects', id))
}

export async function createProject({ name, businessUnitId, encargado, active, responsableEmail }) {
  const created = await insertRow('Projects', {
    name,
    businessUnitId: Number(businessUnitId),
    encargado,
    active: active ?? true,
    responsableEmail: responsableEmail ? responsableEmail.toLowerCase().trim() : null,
  })
  return attachBusinessUnit(created)
}

export async function updateProject(id, { name, businessUnitId, encargado, active, responsableEmail }) {
  const updated = await updateRow('Projects', id, {
    name,
    businessUnitId: businessUnitId === undefined ? undefined : Number(businessUnitId),
    encargado,
    active,
    responsableEmail: responsableEmail === undefined ? undefined : (responsableEmail ? responsableEmail.toLowerCase().trim() : null),
  })
  return attachBusinessUnit(updated)
}

export async function listRetentionRates() {
  return listRows('RetentionRates')
}
