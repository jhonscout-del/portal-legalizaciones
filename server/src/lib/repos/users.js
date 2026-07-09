import { listRows, findRow, findRows, insertRow, updateRow } from '../excelDb.js'

export async function listUsers() {
  const rows = await listRows('Users')
  return [...rows].sort((a, b) => String(a.name).localeCompare(String(b.name)))
}

export async function getUser(id) {
  return findRow('Users', id)
}

export async function findByMicrosoftOid(microsoftOid) {
  const [match] = await findRows('Users', (u) => u.microsoftOid === microsoftOid)
  return match ?? null
}

export async function findByEmail(email) {
  const lower = email.toLowerCase()
  const [match] = await findRows('Users', (u) => u.email === lower)
  return match ?? null
}

export async function createUser({ microsoftOid, email, name, role }) {
  return insertRow('Users', {
    microsoftOid,
    email: email.toLowerCase(),
    name,
    role,
    signatureFileId: null,
    signatureMimeType: null,
    createdAt: new Date().toISOString(),
  })
}

export async function upsertUserByEmail({ email, name, role }) {
  const existing = await findByEmail(email)
  if (existing) {
    return updateRow('Users', existing.id, { name, role })
  }
  return createUser({ microsoftOid: `dev-${email.toLowerCase()}`, email, name, role })
}

export async function updateUserRole(id, role) {
  return updateRow('Users', id, { role })
}

export async function updateUserSignature(id, signatureFileId, signatureMimeType) {
  return updateRow('Users', id, { signatureFileId, signatureMimeType })
}
