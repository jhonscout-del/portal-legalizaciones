// Crea (si no existe) el libro CCCM-DB.xlsx en el OneDrive de la cuenta de
// servicio, con una hoja + Tabla de Excel por entidad, y lo sube vía
// Microsoft Graph. Requiere que la app de Entra ID ya tenga el permiso de
// aplicación Files.ReadWrite.All concedido (Grant admin consent).
//
// Uso: node scripts/init-workbook.js

import 'dotenv/config'
import ExcelJS from 'exceljs'
import { graphFetch, graphJson } from '../src/lib/graphClient.js'
import { TABLES, TABLE_NAMES } from '../src/lib/excelSchema.js'

const RETENTION_RATES = [
  { concepto: 'Hoteles y restaurantes', baseGravable: 100000, porcentaje: 0.035 },
  { concepto: 'Transporte terrestre pasajeros', baseGravable: 100000, porcentaje: 0.01 },
  { concepto: 'Transporte fluvial pasajeros', baseGravable: 100000, porcentaje: 0.01 },
  { concepto: 'Compras (responsables de IVA)', baseGravable: 498000, porcentaje: 0.025 },
  { concepto: 'Compras (no responsables de IVA)', baseGravable: 498000, porcentaje: 0.035 },
]

const BUSINESS_UNITS = [
  { code: '009', name: 'CCCM', donor: 'CCCM', active: true },
  { code: '010', name: 'CCCM', donor: 'THE FEDERAL MINISTER FOR FOREIGN AFFAIRS', active: true },
  { code: '035', name: 'ALEMANIA 2024', donor: 'THE FEDERAL MINISTER FOR FOREIGN AFFAIRS', active: true },
  { code: '039', name: 'PNUD 2025', donor: 'PROGRAMA DE LAS NACIONES UNIDAS PARA EL DESARROLLO', active: true },
  { code: '040', name: 'COSUDE 2025', donor: 'AGENCIA DE COOPERACION SUIZA PARA EL DESARROLLO - COSUDE', active: true },
  { code: '041', name: 'NORAD 2026 - 2029', donor: 'AGENCIA NORUEGA DE COOPERACION PARA EL DESARROLLO - NORAD', active: true },
  { code: '042', name: 'DEPARTAMENTO DE ESTADO 2026 - 2027', donor: 'DEPARTAMENTO DE ESTADO DE ESTADOS UNIDOS', active: true },
]

function getServiceUpn() {
  const upn = process.env.ONEDRIVE_SERVICE_UPN || process.env.MAIL_SENDER_UPN
  if (!upn) throw new Error('Define ONEDRIVE_SERVICE_UPN (o MAIL_SENDER_UPN) en server/.env')
  return upn
}

function getWorkbookPath() {
  return process.env.WORKBOOK_PATH || 'CCCM-Portal/CCCM-DB.xlsx'
}

function buildWorkbook() {
  const workbook = new ExcelJS.Workbook()
  const emptyTablesToClean = []

  for (const tableName of [...TABLE_NAMES, 'Counters']) {
    const schema = TABLES[tableName]
    const sheet = workbook.addWorksheet(schema.sheet)

    let rows
    if (tableName === 'RetentionRates') {
      rows = RETENTION_RATES.map((r, i) => [i + 1, r.concepto, r.baseGravable, r.porcentaje])
    } else if (tableName === 'BusinessUnits') {
      rows = BUSINESS_UNITS.map((bu, i) => [i + 1, bu.code, bu.name, bu.donor, bu.active])
    } else if (tableName === 'Counters') {
      const seededCounts = { BusinessUnits: BUSINESS_UNITS.length, RetentionRates: RETENTION_RATES.length }
      rows = TABLE_NAMES.map((name) => [name, (seededCounts[name] ?? 0) + 1])
    } else {
      // Tabla vacía al inicio: exceljs necesita al menos una fila para crear
      // la Tabla; se agrega una fila en blanco y se borra después de subir.
      rows = [schema.columns.map(() => '')]
      emptyTablesToClean.push(tableName)
    }

    sheet.addTable({
      name: tableName,
      ref: 'A1',
      headerRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: schema.columns.map((col) => ({ name: col, filterButton: true })),
      rows,
    })

    // Columnas de fecha y de texto-que-parece-número (códigos, teléfonos,
    // cédulas...) como Texto: sin esto, Excel las auto-convierte a número y
    // se pierden ceros a la izquierda o se pierde la fecha exacta.
    ;[...schema.dateColumns, ...schema.textColumns].forEach((colName) => {
      const colIndex = schema.columns.indexOf(colName) + 1
      sheet.getColumn(colIndex).numFmt = '@'
    })
  }

  return { workbook, emptyTablesToClean }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function uploadWorkbook(buffer) {
  const upn = getServiceUpn()
  const encodedPath = getWorkbookPath().split('/').map(encodeURIComponent).join('/')
  const res = await graphFetch(`/users/${encodeURIComponent(upn)}/drive/root:/${encodedPath}:/content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    body: buffer,
  })
  if (!res.ok) {
    throw new Error(`Subida del libro falló (${res.status}): ${await res.text()}`)
  }
  return res.json()
}

async function waitForWorkbookReady(itemId, upn, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try {
      const data = await graphJson(`/users/${encodeURIComponent(upn)}/drive/items/${itemId}/workbook/tables`)
      return data
    } catch (err) {
      if (i === attempts - 1) throw err
      await sleep(2000)
    }
  }
}

async function cleanupPlaceholderRow(itemId, upn, tableName) {
  await graphJson(`/users/${encodeURIComponent(upn)}/drive/items/${itemId}/workbook/tables/${tableName}/rows/itemAt(index=0)`, {
    method: 'DELETE',
  })
}

async function main() {
  const upn = getServiceUpn()
  const path = getWorkbookPath()

  console.log(`Verificando si ya existe ${path} en el OneDrive de ${upn}...`)
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const existing = await graphFetch(`/users/${encodeURIComponent(upn)}/drive/root:/${encodedPath}`)
  if (existing.ok) {
    console.log('El libro ya existe. No se sobrescribe. Si quieres recrearlo, bórralo primero en OneDrive.')
    return
  }

  console.log('Construyendo el libro con exceljs...')
  const { workbook, emptyTablesToClean } = buildWorkbook()
  const buffer = await workbook.xlsx.writeBuffer()

  console.log(`Subiendo ${(buffer.byteLength / 1024).toFixed(0)} KB a OneDrive...`)
  const uploaded = await uploadWorkbook(buffer)
  console.log('Subido. Id del archivo:', uploaded.id)

  console.log('Esperando a que Graph pueda leer las tablas del libro...')
  const tablesInfo = await waitForWorkbookReady(uploaded.id, upn)
  console.log(`Graph reconoce ${tablesInfo.value.length} tablas:`, tablesInfo.value.map((t) => t.name).join(', '))

  const expectedTables = TABLE_NAMES.length + 1 // + Counters
  if (tablesInfo.value.length !== expectedTables) {
    console.warn(
      `Aviso: se esperaban ${expectedTables} tablas y Graph reportó ${tablesInfo.value.length}. Revisa el libro manualmente antes de continuar.`,
    )
  }

  console.log('Quitando filas de relleno de las tablas vacías...')
  for (const tableName of emptyTablesToClean) {
    await cleanupPlaceholderRow(uploaded.id, upn, tableName)
  }

  console.log('Listo. El portal ya puede usar este libro como base de datos.')
}

main().catch((err) => {
  console.error('Error inicializando el libro:', err)
  process.exit(1)
})
