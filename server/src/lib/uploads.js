import multer from 'multer'

// Los archivos ya no se guardan en disco local (Azure App Service borra la
// carpeta de la app en cada deploy) — quedan en memoria como Buffer y de ahí
// se suben a OneDrive vía graphFiles.js.

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_SIGNATURE_SIZE = 2 * 1024 * 1024 // 2MB

export const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_SIZE },
})

const SIGNATURE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export const signatureUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIGNATURE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!SIGNATURE_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('La firma debe ser una imagen PNG, JPEG o WEBP'))
    }
    cb(null, true)
  },
})
