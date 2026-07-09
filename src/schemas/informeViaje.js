import { z } from 'zod'
import { destinatariosField } from './shared.js'

export const informeViajeSchema = z.object({
  fechaInicioViaje: z.string().min(1, 'Requerido'),
  duracionDias: z.coerce.number().int().positive('Debe ser mayor a 0'),
  nombreSolicitante: z.string().min(1, 'Requerido'),
  documentoIdentidad: z.string().min(1, 'Requerido'),
  direccion: z.string().min(1, 'Requerido'),
  telefono: z.string().min(1, 'Requerido'),
  ciudad: z.string().min(1, 'Requerido'),
  ruta: z.string().min(1, 'Requerido'),
  projectId: z.string().min(1, 'Selecciona el proyecto'),
  tituloReferencia: z.string().min(1, 'Requerido'),
  objetoViaje: z.string().min(1, 'Requerido'),
  descripcionActividad: z.string().min(1, 'Requerido'),
  destinatarios: destinatariosField,
})
