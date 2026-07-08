import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import cors from 'cors'
import { sessionStore } from './lib/sessionStore.js'
import { authRouter } from './routes/auth.js'
import { catalogoRouter } from './routes/catalogo.js'
import { solicitudesRouter } from './routes/solicitudes.js'
import { legalizacionesRouter } from './routes/legalizaciones.js'
import { informesViajeRouter } from './routes/informesViaje.js'
import { usersRouter } from './routes/users.js'

const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }))
app.use(express.json())
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 8 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' },
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

app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`)
})
