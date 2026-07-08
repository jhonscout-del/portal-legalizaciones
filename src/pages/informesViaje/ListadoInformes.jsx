import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { formatDate } from '../../lib/constants.js'

export function ListadoInformes() {
  const informes = useQuery({ queryKey: ['informes-viaje'], queryFn: () => api.get('/informes-viaje') })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Informes de Viaje</h1>
        <Link to="/informes-viaje/nuevo" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-neutral-900">
          + Nuevo informe
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
              <th className="px-4 py-2">Fecha inicio</th>
              <th>Solicitante</th>
              <th>Proyecto</th>
              <th>Ruta</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {informes.data?.map((i) => (
              <tr key={i.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="px-4 py-2">{formatDate(i.fechaInicioViaje)}</td>
                <td>{i.nombreSolicitante}</td>
                <td>{i.project?.name}</td>
                <td>{i.ruta}</td>
                <td className="px-4"><Link to={`/informes-viaje/${i.id}`} className="text-sky-600 hover:underline">Ver</Link></td>
              </tr>
            ))}
            {informes.data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-500">Aún no hay informes de viaje.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
