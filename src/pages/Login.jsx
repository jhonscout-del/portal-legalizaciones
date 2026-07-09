import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { ROLE_LABELS } from '../lib/constants.js'

export function Login() {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const [devEmail, setDevEmail] = useState('')
  const [devName, setDevName] = useState('')
  const [devRole, setDevRole] = useState('SOLICITANTE')
  const [devError, setDevError] = useState(null)
  const [adminUser, setAdminUser] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState(null)

  async function handleDevLogin(e) {
    e.preventDefault()
    setDevError(null)
    try {
      await api.post('/auth/dev-login', { email: devEmail, name: devName, role: devRole })
      await refresh()
      navigate('/')
    } catch (err) {
      setDevError(err.message)
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault()
    setAdminError(null)
    try {
      await api.post('/auth/local-login', { username: adminUser, password: adminPassword })
      await refresh()
      navigate('/')
    } catch (err) {
      setAdminError(err.message)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-xl font-semibold">Portal de Formatos CCCM</h1>
        <p className="mt-1 text-sm text-neutral-500">Inicia sesión con tu cuenta corporativa de Microsoft 365.</p>

        <a
          href="/api/auth/login"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#2f2f2f] px-4 py-2.5 text-sm font-medium text-white hover:bg-black"
        >
          Iniciar sesión con Microsoft
        </a>

        <details className="mt-6 rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-700">
          <summary className="cursor-pointer font-medium text-neutral-600 dark:text-neutral-400">
            Acceso de administración
          </summary>
          <form onSubmit={handleAdminLogin} className="mt-3 flex flex-col gap-2">
            <input
              type="text"
              required
              placeholder="Usuario"
              value={adminUser}
              onChange={(e) => setAdminUser(e.target.value)}
              className="rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800"
            />
            <input
              type="password"
              required
              placeholder="Contraseña"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800"
            />
            {adminError && <p className="text-xs text-red-600">{adminError}</p>}
            <button type="submit" className="mt-1 rounded-md bg-neutral-700 px-3 py-1.5 font-medium text-white hover:bg-neutral-800">
              Entrar como administrador
            </button>
          </form>
        </details>

        {import.meta.env.DEV && (
          <details className="mt-4 rounded-md border border-dashed border-amber-400 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-amber-700 dark:text-amber-400">
              Acceso de desarrollo (sin Azure)
            </summary>
            <form onSubmit={handleDevLogin} className="mt-3 flex flex-col gap-2">
              <input
                type="email"
                required
                placeholder="correo@cccm.local"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                className="rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800"
              />
              <input
                type="text"
                placeholder="Nombre"
                value={devName}
                onChange={(e) => setDevName(e.target.value)}
                className="rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800"
              />
              <select
                value={devRole}
                onChange={(e) => setDevRole(e.target.value)}
                className="rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800"
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {devError && <p className="text-xs text-red-600">{devError}</p>}
              <button type="submit" className="mt-1 rounded-md bg-amber-500 px-3 py-1.5 font-medium text-white hover:bg-amber-600">
                Entrar como usuario de prueba
              </button>
            </form>
          </details>
        )}
      </div>
    </div>
  )
}
