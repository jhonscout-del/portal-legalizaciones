import { z } from 'zod'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const destinatariosField = z
  .string()
  .optional()
  .refine(
    (value) => !value || value.split(',').every((email) => EMAIL_RE.test(email.trim())),
    'Ingresa correos válidos separados por coma',
  )
