import { ConfidentialClientApplication } from '@azure/msal-node'

let appOnlyClient = null

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

function parseRecipients(value) {
  if (!value) return []
  return value
    .split(',')
    .map((email) => email.trim())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
}

export async function sendMailToRecipients({ to, subject, html }) {
  const recipients = parseRecipients(to)
  if (recipients.length === 0) return { sent: false, reason: 'Sin destinatarios válidos' }

  const senderUpn = process.env.MAIL_SENDER_UPN
  if (!senderUpn) return { sent: false, reason: 'MAIL_SENDER_UPN no configurado' }

  const tokenResponse = await getAppOnlyClient().acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  })

  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderUpn)}/sendMail`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenResponse.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: recipients.map((address) => ({ emailAddress: { address } })),
      },
      saveToSentItems: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Graph sendMail falló (${res.status}): ${text}`)
  }

  return { sent: true, recipients }
}
