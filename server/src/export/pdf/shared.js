import React from 'react'
import { StyleSheet, View, Text, Image } from '@react-pdf/renderer'
import fs from 'node:fs'
import path from 'node:path'
import { SIGNATURES_DIR } from '../../lib/uploads.js'

const h = React.createElement

const MIME_BY_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }

export function signatureImageDataUri(user) {
  if (!user?.signatureImagePath) return null
  try {
    const filePath = path.join(SIGNATURES_DIR, user.signatureImagePath)
    const buffer = fs.readFileSync(filePath)
    const mime = MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'image/png'
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

export const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '2 solid #1a1a1a', paddingBottom: 8 },
  logoBox: { width: 90, height: 40, border: '1 solid #999', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 6, color: '#999', textAlign: 'center' },
  orgName: { fontSize: 8, color: '#444' },
  title: { fontSize: 13, fontWeight: 'bold', textAlign: 'right' },
  section: { marginTop: 10 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 4, backgroundColor: '#eee', padding: 3 },
  fieldRow: { flexDirection: 'row', marginBottom: 3 },
  field: { flex: 1, flexDirection: 'row', marginRight: 8 },
  fieldLabel: { fontWeight: 'bold', marginRight: 4 },
  table: { marginTop: 4, border: '1 solid #333' },
  tableRow: { flexDirection: 'row', borderBottom: '1 solid #ccc' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#333' },
  th: { color: '#fff', padding: 4, fontSize: 8, fontWeight: 'bold', flex: 1 },
  td: { padding: 4, fontSize: 8, flex: 1 },
  totalRow: { flexDirection: 'row', backgroundColor: '#eee', fontWeight: 'bold' },
  signatures: { flexDirection: 'row', marginTop: 30, justifyContent: 'space-between', flexWrap: 'wrap' },
  signatureBox: { width: '30%', textAlign: 'center', marginBottom: 16 },
  signatureBoxQuarter: { width: '23%', textAlign: 'center', marginBottom: 16 },
  signatureLine: { borderTop: '1 solid #333', marginTop: 24, paddingTop: 3 },
  signatureImage: { width: 100, height: 40, objectFit: 'contain', alignSelf: 'center', marginTop: 16 },
  attachmentRow: { flexDirection: 'row', fontSize: 8, marginBottom: 2 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, fontSize: 6, color: '#666', textAlign: 'center', borderTop: '1 solid #ccc', paddingTop: 4 },
})

export const CCCM_FOOTER = 'Asociación Campaña Colombiana Contra Minas — Calle 26 B 49-45 ED KLM PI 13, Bogotá D.C. — Tel.: 2843601 ext 108 - 3204935185'

export function formatCOP(value) {
  const n = Number(value) || 0
  return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  // Fecha-solo guardada como medianoche UTC: forzar timeZone UTC para
  // no correr un día hacia atrás si el servidor corre en otra zona horaria.
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })
}

export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// boxStyle: styles.signatureBox (3 firmas) o styles.signatureBoxQuarter (4 firmas)
export function SignatureBox({ boxStyle, label, user, at, pending }) {
  const dataUri = signatureImageDataUri(user)
  return h(View, { style: boxStyle }, [
    dataUri ? h(Image, { key: 'img', src: dataUri, style: styles.signatureImage }) : null,
    h(View, { key: 'line', style: styles.signatureLine }, h(Text, null, label)),
    h(Text, { key: 'name' }, user ? `${user.name}${at ? ` — ${formatDateTime(at)}` : ''}` : (pending ?? 'Pendiente')),
  ])
}

export function AttachmentsSection({ attachments }) {
  if (!attachments?.length) return null
  return h(View, { style: styles.section }, [
    h(Text, { key: 'title', style: styles.sectionTitle }, 'Archivos adjuntos'),
    ...attachments.map((a, idx) =>
      h(Text, { key: `att-${idx}`, style: styles.attachmentRow }, `• ${a.filename} (${a.uploadedBy?.name ?? ''})`),
    ),
  ])
}
