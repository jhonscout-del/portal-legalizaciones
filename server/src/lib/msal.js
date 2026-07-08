import { ConfidentialClientApplication } from '@azure/msal-node'

export const REDIRECT_URI = process.env.AZURE_REDIRECT_URI
export const SCOPES = ['User.Read']

let cachedClient = null

// Construido de forma perezosa: si las credenciales de Azure aún no están
// configuradas (por ejemplo mientras se usa DEV_AUTH_BYPASS en desarrollo),
// el servidor debe poder arrancar igual; el error solo debe ocurrir si
// alguien realmente intenta iniciar el flujo de login con Microsoft.
export function getMsalClient() {
  if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_SECRET) {
    throw new Error(
      'Microsoft Entra ID no está configurado: define AZURE_CLIENT_ID, AZURE_TENANT_ID y AZURE_CLIENT_SECRET en server/.env',
    )
  }
  if (!cachedClient) {
    cachedClient = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
      },
    })
  }
  return cachedClient
}
