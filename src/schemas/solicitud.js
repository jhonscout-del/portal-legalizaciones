import { z } from 'zod'
import { destinatariosField } from './shared.js'

export const TIPO_PARAM_TO_ENUM = {
  viaticos: 'VIATICOS',
  operacional: 'OPERACIONAL',
  'genero-erm': 'GENERO_ERM',
}

const itemSchema = z.object({
  concepto: z.string().min(1, 'Selecciona un concepto'),
  fechaInicio: z.string().min(1, 'Requerido'),
  fechaFin: z.string().min(1, 'Requerido'),
  numeroEquipos: z.union([z.string().length(0), z.coerce.number().int().positive()]).optional(),
  valor: z.coerce.number().positive('El valor debe ser mayor a 0'),
})

export const solicitudSchema = z.object({
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  aFavorDe: z.string().min(1, 'Nombre completo obligatorio'),
  nitCc: z
    .string()
    .regex(/^\d{6,12}$/, 'Solo dígitos, entre 6 y 12 caracteres'),
  direccion: z.string().min(1, 'Obligatorio'),
  telefono: z.string().min(1, 'Obligatorio'),
  porConceptoDe: z.string().min(6, 'Mínimo 6 caracteres').max(200, 'Máximo 200 caracteres'),
  projectId: z.string().min(1, 'Selecciona la unidad de negocio'),
  cuentaBancariaNo: z.string().min(1, 'Obligatorio'),
  entidadBancaria: z.string().min(1, 'Obligatorio'),
  aNombreDe: z.string().min(1, 'Obligatorio'),
  cedulaNitTitular: z.string().min(1, 'Obligatorio'),
  items: z.array(itemSchema).min(1, 'Agrega al menos un concepto'),
  destinatarios: destinatariosField,
})
