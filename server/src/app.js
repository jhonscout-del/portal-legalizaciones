import 'dotenv/config'
import 'express-async-errors'
import express from 'express'
import session from 'express-session'
import cors from 'cors'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { sessionStore } from './lib/sessionStore.js'
import { authRouter } from './routes/auth.js'
import { catalogoRouter } from './routes/catalogo.js'
import { solicitudesRouter } from './routes/solicitudes.js'
import { legalizacionesRouter } from './routes/legalizaciones.js'
import { informesViajeRouter } from './routes/informesViaje.js'
import { usersRouter } from './routes/users.js'
import { attachmentsRouter } from './routes/attachments.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

const app = express()

if (isProduction) {
  // Azure App Service (y la mayoría de PaaS) terminan TLS en un proxy
  // delante del proceso Node; sin esto, secure cookies y req.ip no funcionan.
  app.set('trust proxy', 1)
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }))
app.use(express.json())
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 8 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax', secure: isProduction },
  }),
)

app.use('/api/auth', authRouter)
if (process.env.DEV_AUTH_BYPASS === 'true') {
  const { devAuthRouter } = await import('./routes/devAuth.js')
  console.warn('[DEV] DEV_AUTH_BYPASS activo: /api/auth/dev-login habilitado. No usar en producción.')
  app.use('/api/auth', devAuthRouter)
}
app.use('/api/catalogo', catalogoRouter)
app.use('/api/solicitudes', solicitudesRouter)
app.use('/api/legalizaciones', legalizacionesRouter)
app.use('/api/informes-viaje', informesViajeRouter)
app.use('/api/users', usersRouter)
app.use('/api/attachments', attachmentsRouter)

// En producción, este mismo proceso sirve el cliente ya compilado
// (repo_root/dist, generado con `npm run build` en la raíz) para que todo
// el portal viva en un único servicio de Azure App Service, sin problemas
// de cookies entre orígenes distintos.
const clientDist = path.join(__dirname, '..', '..', 'dist')
if (isProduction && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.use('/api', (req, res) => res.status(404).json({ error: 'No encontrado' }))

app.use((err, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Archivo inválido: ${err.message}` })
  }
  if (err?.message?.includes('imagen PNG, JPEG o WEBP')) {
    return res.status(400).json({ error: err.message })
  }
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`)
})
