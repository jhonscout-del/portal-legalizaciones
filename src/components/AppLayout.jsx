import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLE_LABELS } from '../lib/constants.js'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', roles: null },
  { to: '/bandeja', label: 'Bandeja de aprobación', roles: ['APROBADOR', 'CONTABLE', 'ADMINISTRATIVO'] },
  { to: '/solicitudes/viaticos', label: 'Solicitud de Viáticos', roles: null },
  { to: '/solicitudes/operacional', label: 'Solicitud Operacional', roles: null },
  { to: '/solicitudes/genero-erm', label: 'Solicitud Género y ERM', roles: null },
  { to: '/legalizaciones', label: 'Legalizaciones', roles: null },
  { to: '/informes-viaje', label: 'Informes de Viaje', roles: null },
  { to: '/catalogo/proyectos', label: 'Proyectos y Unidades de Negocio', roles: ['ADMINISTRATIVO'] },
  { to: '/catalogo/usuarios', label: 'Usuarios y Roles', roles: ['ADMINISTRATIVO'] },
  { to: '/perfil', label: 'Mi perfil / firma', roles: null },
]

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-svh">
      <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-6 px-2">
          <p className="text-lg font-semibold">Portal CCCM</p>
          <p className="text-xs text-neutral-500">Formatos administrativos</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.some((r) => user?.roles?.includes(r))).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div />
          <div className="flex items-center gap-3 text-sm">
            <span className="text-neutral-700 dark:text-neutral-300">
              {user?.name} ·{' '}
              <span className="text-neutral-500">
                {(user?.roles ?? []).map((r) => ROLE_LABELS[r] ?? r).join(', ')}
              </span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cerrar sesión
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
