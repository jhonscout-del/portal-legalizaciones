import fs from 'node:fs'
import session from 'express-session'
import FileStoreFactory from 'session-file-store'

const FileStore = FileStoreFactory(session)

// SESSIONS_DIR permite apuntar a almacenamiento persistente en producción
// (p. ej. Azure App Service borra la carpeta de la app en cada deploy, pero
// /home sí persiste). En desarrollo local usa server/sessions por defecto.
const sessionsPath =
  process.env.SESSIONS_DIR || new URL('../../sessions', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

fs.mkdirSync(sessionsPath, { recursive: true })

export const sessionStore = new FileStore({
  path: sessionsPath,
  ttl: 8 * 60 * 60,
  logFn: () => {},
})
