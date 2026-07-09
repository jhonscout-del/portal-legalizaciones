import { listRows, findRow, findRows, insertRow, deleteRow } from '../excelDb.js'
import { uploadFile, downloadFile, deleteFile, ATTACHMENTS_FOLDER } from '../graphFiles.js'
import { getUser } from './users.js'

export async function listAttachments(relatedType, relatedId) {
  const [rows, users] = await Promise.all([
    findRows('Attachments', (a) => a.relatedType === relatedType && Number(a.relatedId) === Number(relatedId)),
    listRows('Users'),
  ])
  const usersById = new Map(users.map((u) => [String(u.id), u]))
  return rows
    .map((a) => ({ ...a, uploadedBy: usersById.get(String(a.uploadedById)) ?? null }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function createAttachment({ relatedType, relatedId, file, uploadedById }) {
  const { driveItemId, size } = await uploadFile({
    buffer: file.buffer,
    folder: ATTACHMENTS_FOLDER,
    filename: `${relatedType}-${relatedId}-${Date.now()}-${file.originalname}`,
    mimeType: file.mimetype,
  })

  const row = await insertRow('Attachments', {
    relatedType,
    relatedId: Number(relatedId),
    filename: file.originalname,
    mimeType: file.mimetype,
    size,
    driveItemId,
    uploadedById,
    createdAt: new Date().toISOString(),
  })

  const uploadedBy = await getUser(uploadedById)
  return { ...row, uploadedBy }
}

export async function getAttachment(id) {
  return findRow('Attachments', id)
}

export async function downloadAttachment(id) {
  const attachment = await findRow('Attachments', id)
  if (!attachment) return null
  const buffer = await downloadFile(attachment.driveItemId)
  return { attachment, buffer }
}

export async function removeAttachment(id) {
  const attachment = await findRow('Attachments', id)
  if (!attachment) return null
  await deleteRow('Attachments', id)
  await deleteFile(attachment.driveItemId).catch((err) =>
    console.error('No se pudo borrar el archivo en OneDrive:', err.message),
  )
  return attachment
}
