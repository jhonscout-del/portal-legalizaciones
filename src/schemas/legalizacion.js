import { z } from 'zod'

const rubroSchema = z.object({
  seccion: z.enum(['A_SOPORTE', 'B_FACTURA_RETENCION']),
  fecha: z.string().min(1, 'Requerido'),
  nit: z.string().min(1, 'Requerido'),
  beneficiario: z.string().min(1, 'Requerido'),
  noFactura: z.string().min(1, 'Requerido'),
  concepto: z.string().min(1, 'Requerido'),
  valorFactura: z.coerce.number().positive('Debe ser mayor a 0'),
})

export const legalizacionSchema = z.object({
  solicitudId: z.string().min(1, 'Selecciona el anticipo/solicitud original'),
  projectId: z.string().min(1, 'Selecciona el proyecto'),
  fechaSolicitudAnticipo: z.string().min(1, 'Requerido'),
  valorAnticipo: z.coerce.number().positive('Debe ser mayor a 0'),
  nitCc: z.string().min(1, 'Requerido'),
  nombreActividad: z.string().min(1, 'Requerido'),
  rubros: z.array(rubroSchema).min(1, 'Agrega al menos un rubro'),
})
