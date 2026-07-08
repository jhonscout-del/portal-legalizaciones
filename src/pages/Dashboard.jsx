import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

function Card({ to, title, count, description }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <p className="text-sm text-neutral-500">{title}</p>
      <p className="mt-1 text-3xl font-semibold">{count ?? '—'}</p>
      <p className="mt-1 text-xs text-neutral-500">{description}</p>
    </Link>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const solicitudes = useQuery({ queryKey: ['solicitudes'], queryFn: () => api.get('/solicitudes') })
  const legalizaciones = useQuery({ queryKey: ['legalizaciones'], queryFn: () => api.get('/legalizaciones') })
  const informes = useQuery({ queryKey: ['informes-viaje'], queryFn: () => api.get('/informes-viaje') })

  return (
    <div>
      <h1 className="text-2xl font-semibold">Hola, {user?.name}</h1>
      <p className="mt-1 text-neutral-500">Resumen de formatos administrativos.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          to="/solicitudes/viaticos"
          title="Solicitudes de recursos"
          count={solicitudes.data?.length}
          description="Viáticos, Operacional, Género y ERM"
        />
        <Card
          to="/legalizaciones"
          title="Legalizaciones"
          count={legalizaciones.data?.length}
          description="Cuadros de anticipos"
        />
        <Card
          to="/informes-viaje"
          title="Informes de viaje"
          count={informes.data?.length}
          description="Reportes de actividad en terreno"
        />
      </div>
    </div>
  )
}
