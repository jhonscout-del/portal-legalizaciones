// Migración puntual genérica: agrega una columna al final de una Tabla de
// Excel ya existente en el libro real de OneDrive. Las Tablas de Excel
// tienen columnas fijas — cuando excelSchema.js declara una columna nueva,
// hay que crearla también en el archivo real con este script (una sola vez).
// Es seguro ejecutarlo más de una vez: si la columna ya existe, no hace nada.
//
// Uso: node scripts/add-column.js <TableName> <columnName>

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
  const [tableName, columnName] = process.argv.slice(2)
  if (!tableName || !columnName) {
    console.error('Uso: node scripts/add-column.js <TableName> <columnName>')
    process.exit(1)
  }

  const upn = getServiceUpn()
  const path = getWorkbookPath()
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')

  console.log(`Buscando ${path} en el OneDrive de ${upn}...`)
  const item = await graphJson(`/users/${encodeURIComponent(upn)}/drive/root:/${encodedPath}`)
  const base = `/users/${encodeURIComponent(upn)}/drive/items/${item.id}/workbook`

  const columns = await graphJson(`${base}/tables/${tableName}/columns`)
  if (columns.value.some((c) => c.name === columnName)) {
    console.log(`La columna ${columnName} ya existe en ${tableName}. Nada que hacer.`)
    return
  }

  console.log(`Agregando columna ${columnName} al final de la tabla ${tableName}...`)
  await graphJson(`${base}/tables/${tableName}/columns/add`, {
    method: 'POST',
    body: JSON.stringify({ name: columnName }),
  })

  console.log(`Listo. La tabla ${tableName} ahora tiene la columna ${columnName}.`)
}

main().catch((err) => {
  console.error('Error en la migración:', err)
  process.exit(1)
})
