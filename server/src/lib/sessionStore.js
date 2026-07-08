import session from 'express-session'
import FileStoreFactory from 'session-file-store'

const FileStore = FileStoreFactory(session)

export const sessionStore = new FileStore({
  path: new URL('../../sessions', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  ttl: 8 * 60 * 60,
  logFn: () => {},
})
