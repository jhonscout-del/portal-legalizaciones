import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads')
export const ATTACHMENTS_DIR = path.join(UPLOADS_ROOT, 'attachments')
export const SIGNATURES_DIR = path.join(UPLOADS_ROOT, 'signatures')

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function safeName(originalName) {
  const ext = path.extname(originalName).slice(0, 20)
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`
}

export const attachmentUpload = multer({
  limits: { fileSize: MAX_FILE_SIZE },
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, ATTACHMENTS_DIR),
    filename: (req, file, cb) => cb(null, safeName(file.originalname)),
  }),
})

const SIGNATURE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export const signatureUpload = multer({
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!SIGNATURE_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('La firma debe ser una imagen PNG, JPEG o WEBP'))
    }
    cb(null, true)
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, SIGNATURES_DIR),
    filename: (req, file, cb) => cb(null, safeName(file.originalname)),
  }),
})

export function deleteFileIfExists(absolutePath) {
  fs.rm(absolutePath, { force: true }, () => {})
}
