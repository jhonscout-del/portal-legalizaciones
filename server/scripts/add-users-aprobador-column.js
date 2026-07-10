// Migración puntual: agrega la columna 'aprobadorEmail' al final de la Tabla
// de Excel 'Users' en el libro ya existente en OneDrive (excelSchema.js ya
// declara esta columna — este script solo la crea en el archivo real, porque
// las Tablas de Excel tienen sus columnas fijas y no se actualizan solas).
// Es seguro ejecutarlo más de una vez: si la columna ya existe, no hace nada.
//
// Uso: node scripts/add-users-aprobador-column.js

import 'dotenv/config'
import { graphJson } from '../src/lib/graphClient.js'

function getServiceUpn() {
  const upn = process.env.ONEDRIVE_SERVICE_UPN || process.env.MAIL_SENDER_UPN
  if (!upn) throw new Error('Define ONEDRIVE_SERVICE_UPN (o MAIL_SENDER_UPN) en server/.env')
  return upn
}

function getWorkbookPath() {
  return process.env.WORKBOOK_PATH || 'CCCM-Portal/CCCM-DB.xlsx'
}

async function main() {
  const upn = getServiceUpn()
  const path = getWorkbookPath()
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')

  console.log(`Buscando ${path} en el OneDrive de ${upn}...`)
  const item = await graphJson(`/users/${encodeURIComponent(upn)}/drive/root:/${encodedPath}`)
  const base = `/users/${encodeURIComponent(upn)}/drive/items/${item.id}/workbook`

  const columns = await graphJson(`${base}/tables/Users/columns`)
  const already = columns.value.some((c) => c.name === 'aprobadorEmail')
  if (already) {
    console.log('La columna aprobadorEmail ya existe en Users. Nada que hacer.')
    return
  }

  console.log('Agregando columna aprobadorEmail al final de la tabla Users...')
  await graphJson(`${base}/tables/Users/columns/add`, {
    method: 'POST',
    body: JSON.stringify({ name: 'aprobadorEmail' }),
  })

  console.log('Listo. La tabla Users ahora tiene la columna aprobadorEmail.')
}

main().catch((err) => {
  console.error('Error en la migración:', err)
  process.exit(1)
})
