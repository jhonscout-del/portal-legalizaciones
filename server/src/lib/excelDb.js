import { graphJson } from './graphClient.js'
import { TABLES } from './excelSchema.js'

const CACHE_TTL_MS = 10_000

function getServiceUpn() {
  const upn = process.env.ONEDRIVE_SERVICE_UPN || process.env.MAIL_SENDER_UPN
  if (!upn) throw new Error('ONEDRIVE_SERVICE_UPN (o MAIL_SENDER_UPN) no configurado')
  return upn
}

function getWorkbookPath() {
  return process.env.WORKBOOK_PATH || 'CCCM-Portal/CCCM-DB.xlsx'
}

function tableSchema(tableName) {
  const schema = TABLES[tableName]
  if (!schema) throw new Error(`Tabla desconocida: ${tableName}`)
  return schema
}

// --- Resolución del libro (una sola vez por proceso) ---

let workbookItemIdPromise = null

async function getWorkbookItemId() {
  if (!workbookItemIdPromise) {
    const upn = getServiceUpn()
    const encodedPath = getWorkbookPath().split('/').map(encodeURIComponent).join('/')
    workbookItemIdPromise = graphJson(`/users/${encodeURIComponent(upn)}/drive/root:/${encodedPath}`)
      .then((item) => item.id)
      .catch((err) => {
        workbookItemIdPromise = null
        throw err
      })
  }
  return workbookItemIdPromise
}

function workbookBase(itemId, upn) {
  return `/users/${encodeURIComponent(upn)}/drive/items/${itemId}/workbook`
}

// --- Mapeo fila-array (Graph) <-> objeto JS ---

function rowToObject(tableName, valuesArray) {
  const { columns } = tableSchema(tableName)
  const obj = {}
  columns.forEach((col, i) => {
    const val = valuesArray[i]
    obj[col] = val === '' || val === undefined ? null : val
  })
  return obj
}

function objectToRow(tableName, obj) {
  const { columns } = tableSchema(tableName)
  return columns.map((col) => {
    const val = obj[col]
    return val === undefined || val === null ? '' : val
  })
}

// --- Lectura con caché por tabla + coalescing de lecturas concurrentes ---

const tableCache = new Map() // tableName -> { rows, fetchedAt }
const inFlightReads = new Map() // tableName -> Promise<rows>

async function fetchRawRows(tableName) {
  tableSchema(tableName)
  const itemId = await getWorkbookItemId()
  const upn = getServiceUpn()
  let url = `${workbookBase(itemId, upn)}/tables/${tableName}/rows`
  const result = []
  while (url) {
    const data = await graphJson(url)
    for (const r of data.value) {
      result.push({ index: r.index, obj: rowToObject(tableName, r.values[0]) })
    }
    url = data['@odata.nextLink'] || null
  }
  return result
}

export function invalidateCache(tableName) {
  tableCache.delete(tableName)
}

// Tras escribir, el caché se actualiza directamente en vez de solo
// invalidarlo: Graph puede tardar en reflejar una escritura reciente en una
// lectura inmediatamente posterior (no usamos workbook sessions), así que
// "invalidar y volver a pedirle a Graph" puede perder la fila que acabamos
// de escribir (se confirmó en pruebas reales). Como ya sabemos exactamente
// qué cambió, mutamos el caché en memoria en vez de volver a preguntarle a Graph.
function mutateCacheAfterWrite(tableName, mutator) {
  const cached = tableCache.get(tableName)
  if (!cached) return // sin caché previo; la próxima lectura real irá a Graph
  tableCache.set(tableName, { rows: mutator(cached.rows), fetchedAt: Date.now() })
}

export async function listRows(tableName) {
  const cached = tableCache.get(tableName)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.rows

  if (inFlightReads.has(tableName)) return inFlightReads.get(tableName)

  const promise = fetchRawRows(tableName)
    .then((raw) => {
      const rows = raw.map((r) => r.obj)
      tableCache.set(tableName, { rows, fetchedAt: Date.now() })
      return rows
    })
    .finally(() => inFlightReads.delete(tableName))

  inFlightReads.set(tableName, promise)
  return promise
}

export async function findRow(tableName, id) {
  const { idColumn } = tableSchema(tableName)
  const rows = await listRows(tableName)
  return rows.find((r) => String(r[idColumn]) === String(id)) ?? null
}

export async function findRows(tableName, predicate) {
  const rows = await listRows(tableName)
  return rows.filter(predicate)
}

// --- Escritura: cola por tabla (serializa inserts/updates/deletes) ---

const writeQueues = new Map()

function enqueueWrite(tableName, fn) {
  const prev = writeQueues.get(tableName) || Promise.resolve()
  const run = prev.catch(() => {}).then(fn)
  writeQueues.set(tableName, run)
  return run
}

async function patchRowAtIndex(tableName, index, obj) {
  const itemId = await getWorkbookItemId()
  const upn = getServiceUpn()
  await graphJson(`${workbookBase(itemId, upn)}/tables/${tableName}/rows/itemAt(index=${index})`, {
    method: 'PATCH',
    body: JSON.stringify({ values: [objectToRow(tableName, obj)] }),
  })
}

async function getAndIncrementCounter(tableName) {
  return enqueueWrite('Counters', async () => {
    invalidateCache('Counters')
    const raw = await fetchRawRows('Counters')
    const match = raw.find((r) => r.obj.tableName === tableName)
    if (!match) throw new Error(`No hay contador definido para la tabla ${tableName} (revisa la hoja Counters)`)
    const current = Number(match.obj.nextId)
    await patchRowAtIndex('Counters', match.index, { tableName, nextId: current + 1 })
    invalidateCache('Counters')
    return current
  })
}

export async function insertRow(tableName, data) {
  const { idColumn } = tableSchema(tableName)
  return enqueueWrite(tableName, async () => {
    const id = await getAndIncrementCounter(tableName)
    const obj = { ...data, [idColumn]: id }
    const itemId = await getWorkbookItemId()
    const upn = getServiceUpn()
    await graphJson(`${workbookBase(itemId, upn)}/tables/${tableName}/rows`, {
      method: 'POST',
      body: JSON.stringify({ values: [objectToRow(tableName, obj)] }),
    })
    mutateCacheAfterWrite(tableName, (rows) => [...rows, obj])
    return obj
  })
}

export async function updateRow(tableName, id, patch) {
  const { idColumn } = tableSchema(tableName)
  // Igual que Prisma: una clave presente con valor `undefined` significa
  // "no tocar este campo" (distinto de `null`, que sí lo limpia).
  const cleanPatch = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
  return enqueueWrite(tableName, async () => {
    const raw = await fetchRawRows(tableName)
    const match = raw.find((r) => String(r.obj[idColumn]) === String(id))
    if (!match) throw new Error(`No se encontró la fila ${id} en ${tableName}`)
    const merged = { ...match.obj, ...cleanPatch, [idColumn]: match.obj[idColumn] }
    await patchRowAtIndex(tableName, match.index, merged)
    mutateCacheAfterWrite(tableName, (rows) => rows.map((r) => (String(r[idColumn]) === String(id) ? merged : r)))
    return merged
  })
}

export async function deleteRow(tableName, id) {
  const { idColumn } = tableSchema(tableName)
  return enqueueWrite(tableName, async () => {
    const raw = await fetchRawRows(tableName)
    const match = raw.find((r) => String(r.obj[idColumn]) === String(id))
    if (!match) return false
    const itemId = await getWorkbookItemId()
    const upn = getServiceUpn()
    await graphJson(`${workbookBase(itemId, upn)}/tables/${tableName}/rows/itemAt(index=${match.index})`, {
      method: 'DELETE',
    })
    mutateCacheAfterWrite(tableName, (rows) => rows.filter((r) => String(r[idColumn]) !== String(id)))
    return true
  })
}
