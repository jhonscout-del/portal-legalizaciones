export const ROLE_LABELS = {
  SOLICITANTE: 'Solicitante',
  CONTABLE: 'Contabilidad',
  ADMINISTRATIVO: 'Administrativo',
}

export const TIPO_SOLICITUD_LABELS = {
  VIATICOS: 'Viáticos',
  OPERACIONAL: 'Operacional',
  GENERO_ERM: 'Género y ERM',
}

export const ESTADO_LABELS = {
  BORRADOR: 'Borrador',
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  LEGALIZADA: 'Legalizada',
}

export const CONCEPTOS_POR_TIPO = {
  VIATICOS: ['Viáticos', 'Alojamiento', 'Transporte Intermunicipal'],
  OPERACIONAL: [
    'Alimentación ENT',
    'Alimentación ED',
    'Alimentación Enlace Comunitario',
    'Logística',
    'Transporte Terrestre',
    'Transporte Fluvial',
    'Transporte de Carga',
  ],
  GENERO_ERM: [
    'Talleres de Género',
    'Talleres de ERM',
    'Papelería',
    'Refrigerios',
    'Guías',
    'Hospedaje',
    'Alquiler de Espacio',
    'Transporte Terrestre',
    'Transporte Fluvial',
    'Transporte de Carga',
    'Viáticos (Alimentación y Transportes)',
  ],
}

export function formatCOP(value) {
  const n = Number(value) || 0
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

export function formatDate(value) {
  if (!value) return ''
  // Los campos de fecha se guardan como medianoche UTC (solo interesa
  // año/mes/día); forzar timeZone: 'UTC' evita que se muestre un día
  // antes en zonas horarias negativas (p. ej. Colombia, UTC-5).
  return new Date(value).toLocaleDateString('es-CO', { timeZone: 'UTC' })
}

export function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-CO')
}
