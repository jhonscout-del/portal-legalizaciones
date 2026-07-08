import { StyleSheet } from '@react-pdf/renderer'

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
  signatures: { flexDirection: 'row', marginTop: 30, justifyContent: 'space-between' },
  signatureBox: { width: '30%', textAlign: 'center' },
  signatureLine: { borderTop: '1 solid #333', marginTop: 24, paddingTop: 3 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, fontSize: 6, color: '#666', textAlign: 'center', borderTop: '1 solid #ccc', paddingTop: 4 },
})

export const CCCM_FOOTER = 'Asociación Campaña Colombiana Contra Minas — Calle 26 B 49-45 ED KLM PI 13, Bogotá D.C. — Tel.: 2843601 ext 108 - 3204935183'

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
