import { ConfidentialClientApplication } from '@azure/msal-node'

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const MAX_RETRIES = 4

let appOnlyClient = null
let cachedToken = null // { accessToken, expiresOnTimestamp }

function getAppOnlyClient() {
  if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_SECRET) {
    throw new Error('Microsoft Entra ID no está configurado')
  }
  if (!appOnlyClient) {
    appOnlyClient = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
      },
    })
  }
  return appOnlyClient
}

async function getAccessToken() {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresOnTimestamp - 60_000 > now) {
    return cachedToken.accessToken
  }
  const tokenResponse = await getAppOnlyClient().acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  })
  cachedToken = {
    accessToken: tokenResponse.accessToken,
    expiresOnTimestamp: tokenResponse.expiresOn ? new Date(tokenResponse.expiresOn).getTime() : now + 55 * 60_000,
  }
  return cachedToken.accessToken
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Llama a Microsoft Graph con token app-only, reintentando en 429/5xx
 * respetando el header Retry-After (las operaciones de workbook de Excel
 * son especialmente propensas a throttling).
 */
export async function graphFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${GRAPH_BASE}${path}`

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const accessToken = await getAccessToken()
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.body && !(options.body instanceof ArrayBuffer) && !ArrayBuffer.isView(options.body)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...options.headers,
      },
    })

    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get('Retry-After')) || 1 + attempt
      await sleep(retryAfter * 1000)
      continue
    }

    return res
  }
  throw new Error(`Graph request agotó los reintentos: ${url}`)
}

export async function graphJson(path, options = {}) {
  const res = await graphFetch(path, options)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Graph ${options.method || 'GET'} ${path} falló (${res.status}): ${text}`)
  }
  // 202 (p. ej. sendMail) y 204 vienen sin cuerpo — res.json() lanzaría
  // "Unexpected end of JSON input" si se intenta parsear un body vacío.
  if (res.status === 204 || res.status === 202) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}
