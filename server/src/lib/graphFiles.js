import { graphFetch, graphJson } from './graphClient.js'

const SIMPLE_UPLOAD_LIMIT = 4 * 1024 * 1024 // 4MB, límite de Graph para PUT simple
const CHUNK_SIZE = 327680 * 16 // 5MB, múltiplo de 320KiB (requerido por Graph)

export const ATTACHMENTS_FOLDER = 'CCCM-Portal/attachments'
export const SIGNATURES_FOLDER = 'CCCM-Portal/signatures'

function getServiceUpn() {
  const upn = process.env.ONEDRIVE_SERVICE_UPN || process.env.MAIL_SENDER_UPN
  if (!upn) throw new Error('ONEDRIVE_SERVICE_UPN (o MAIL_SENDER_UPN) no configurado')
  return upn
}

function encodedPath(folder, filename) {
  return `${folder}/${filename}`.split('/').map(encodeURIComponent).join('/')
}

async function uploadSimple(buffer, folder, filename, mimeType) {
  const upn = getServiceUpn()
  const res = await graphFetch(`/users/${encodeURIComponent(upn)}/drive/root:/${encodedPath(folder, filename)}:/content`, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType || 'application/octet-stream' },
    body: buffer,
  })
  if (!res.ok) throw new Error(`Subida a OneDrive falló (${res.status}): ${await res.text()}`)
  return res.json()
}

async function uploadChunked(buffer, folder, filename) {
  const upn = getServiceUpn()
  const session = await graphJson(`/users/${encodeURIComponent(upn)}/drive/root:/${encodedPath(folder, filename)}:/createUploadSession`, {
    method: 'POST',
    body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'replace' } }),
  })

  const total = buffer.length
  let start = 0
  let lastResponseJson = null

  while (start < total) {
    const end = Math.min(start + CHUNK_SIZE, total)
    const chunk = buffer.subarray(start, end)
    const res = await fetch(session.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': String(chunk.length),
        'Content-Range': `bytes ${start}-${end - 1}/${total}`,
      },
      body: chunk,
    })
    if (!res.ok) throw new Error(`Subida por partes a OneDrive falló (${res.status}): ${await res.text()}`)
    lastResponseJson = await res.json().catch(() => null)
    start = end
  }

  return lastResponseJson
}

export async function uploadFile({ buffer, folder, filename, mimeType }) {
  const result = buffer.length <= SIMPLE_UPLOAD_LIMIT
    ? await uploadSimple(buffer, folder, filename, mimeType)
    : await uploadChunked(buffer, folder, filename)
  return { driveItemId: result.id, size: result.size ?? buffer.length }
}

export async function downloadFile(driveItemId) {
  const upn = getServiceUpn()
  const res = await graphFetch(`/users/${encodeURIComponent(upn)}/drive/items/${driveItemId}/content`)
  if (!res.ok) throw new Error(`Descarga desde OneDrive falló (${res.status})`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function deleteFile(driveItemId) {
  const upn = getServiceUpn()
  const res = await graphFetch(`/users/${encodeURIComponent(upn)}/drive/items/${driveItemId}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 404) {
    throw new Error(`No se pudo borrar el archivo en OneDrive (${res.status})`)
  }
}
