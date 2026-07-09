import { graphJson } from './graphClient.js'

function parseRecipients(value) {
  if (!value) return []
  return value
    .split(',')
    .map((email) => email.trim())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
}

// El admin local ('local-admin') y los usuarios de /api/auth/dev-login
// ('dev-...') no tienen un buzón real en el tenant — para esos, el correo
// debe salir desde la cuenta de servicio (MAIL_SENDER_UPN), no desde su
// "email" simulado.
export function resolveSenderUpn(user) {
  const isRealMicrosoftAccount = user?.microsoftOid && user.microsoftOid !== 'local-admin' && !user.microsoftOid.startsWith('dev-')
  return (isRealMicrosoftAccount ? user.email : null) || process.env.MAIL_SENDER_UPN
}

export async function sendMailToRecipients({ to, subject, html, senderUpn }) {
  const recipients = parseRecipients(to)
  if (recipients.length === 0) return { sent: false, reason: 'Sin destinatarios válidos' }

  const upn = senderUpn || process.env.MAIL_SENDER_UPN
  if (!upn) return { sent: false, reason: 'No hay remitente configurado' }

  await graphJson(`/users/${encodeURIComponent(upn)}/sendMail`, {
    method: 'POST',
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: recipients.map((address) => ({ emailAddress: { address } })),
      },
      saveToSentItems: true,
    }),
  })

  return { sent: true, recipients }
}
