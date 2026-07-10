import { listRows, findRow, findRows, insertRow, updateRow } from '../excelDb.js'

export const ALL_ROLES = ['SOLICITANTE', 'APROBADOR', 'CONTABLE', 'ADMINISTRATIVO']

// Un usuario puede tener varios roles a la vez (p. ej. Solicitante +
// Aprobador + Administrativo). Se guardan en una sola columna de Excel
// ('role') como texto separado por comas — no hace falta una tabla aparte.
// SOLICITANTE se fuerza siempre: todo el que ingresa al portal puede crear
// solicitudes, tenga o no roles adicionales.
export function parseRoles(rawRole) {
  const parsed = String(rawRole || '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
  return [...new Set(['SOLICITANTE', ...parsed])]
}

function serializeRoles(roles) {
  return [...new Set(['SOLICITANTE', ...roles])].join(',')
}

function toPublicUser(user) {
  if (!user) return null
  const { role, ...rest } = user
  return { ...rest, roles: parseRoles(role) }
}

export async function listUsers() {
  const rows = await listRows('Users')
  return [...rows].sort((a, b) => String(a.name).localeCompare(String(b.name))).map(toPublicUser)
}

export async function getUser(id) {
  return toPublicUser(await findRow('Users', id))
}

export async function findByMicrosoftOid(microsoftOid) {
  const [match] = await findRows('Users', (u) => u.microsoftOid === microsoftOid)
  return toPublicUser(match ?? null)
}

export async function findByEmail(email) {
  const lower = email.toLowerCase()
  const [match] = await findRows('Users', (u) => u.email === lower)
  return toPublicUser(match ?? null)
}

export async function createUser({ microsoftOid, email, name, roles = [] }) {
  const row = await insertRow('Users', {
    microsoftOid: microsoftOid || null,
    email: email.toLowerCase(),
    name,
    role: serializeRoles(roles),
    signatureFileId: null,
    signatureMimeType: null,
    createdAt: new Date().toISOString(),
    aprobadorEmail: null,
  })
  return toPublicUser(row)
}

// Usado por /api/auth/dev-login: si el correo ya existe, se AGREGA el rol
// elegido a los que ya tenía (no los reemplaza), para no perder asignaciones
// manuales previas al repetir el login de prueba.
export async function upsertUserByEmail({ email, name, role }) {
  const existing = await findByEmail(email)
  if (existing) {
    const roles = [...new Set([...existing.roles, role])]
    return toPublicUser(await updateRow('Users', existing.id, { name, role: serializeRoles(roles) }))
  }
  return createUser({ microsoftOid: `dev-${email.toLowerCase()}`, email, name, roles: [role] })
}

// Asignación manual de roles desde Usuarios y Roles (admin) — reemplaza el
// conjunto completo de roles del usuario (SOLICITANTE siempre se conserva).
export async function updateUserRoles(id, roles) {
  return toPublicUser(await updateRow('Users', id, { role: serializeRoles(roles) }))
}

export async function updateUserSignature(id, signatureFileId, signatureMimeType) {
  return toPublicUser(await updateRow('Users', id, { signatureFileId, signatureMimeType }))
}

// Vincula una cuenta ya existente (creada como placeholder por
// setAprobadorEmail, o por upsertUserByEmail en dev) con su identidad real
// de Microsoft la primera vez que esa persona inicia sesión de verdad.
export async function linkMicrosoftAccount(id, microsoftOid, name) {
  return toPublicUser(await updateRow('Users', id, { microsoftOid, name }))
}

// El usuario declara en su perfil el correo de la persona que debe
// aprobarle sus solicitudes. Esto le agrega automáticamente el rol
// APROBADOR a esa persona (creándola como cuenta pendiente de vincular si
// aún no existe), sin tocar la asignación manual de roles que ya tenga.
export async function setAprobadorEmail(userId, aprobadorEmail) {
  const email = aprobadorEmail ? aprobadorEmail.toLowerCase().trim() : null
  const updated = await updateRow('Users', userId, { aprobadorEmail: email })

  if (email) {
    const target = await findByEmail(email)
    if (!target) {
      await createUser({ microsoftOid: null, email, name: email, roles: ['APROBADOR'] })
    } else if (!target.roles.includes('APROBADOR')) {
      await updateUserRoles(target.id, [...target.roles, 'APROBADOR'])
    }
  }

  return toPublicUser(updated)
}
