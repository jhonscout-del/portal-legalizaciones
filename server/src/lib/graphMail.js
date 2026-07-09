import { graphJson } from './graphClient.js'

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

  await graphJson(`/users/${encodeURIComponent(senderUpn)}/sendMail`, {
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
