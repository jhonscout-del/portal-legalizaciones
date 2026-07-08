import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { StatusBadge } from '../../components/StatusBadge.jsx'
import { TIPO_PARAM_TO_ENUM } from '../../schemas/solicitud.js'
import { TIPO_SOLICITUD_LABELS, formatCOP, formatDate } from '../../lib/constants.js'

export function ListadoSolicitudes() {
  const { tipo } = useParams()
  const tipoEnum = TIPO_PARAM_TO_ENUM[tipo]
  const solicitudes = useQuery({
    queryKey: ['solicitudes', tipoEnum],
    queryFn: () => api.get(`/solicitudes?tipo=${tipoEnum}`),
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Solicitudes — {TIPO_SOLICITUD_LABELS[tipoEnum]}</h1>
        <Link to={`/solicitudes/${tipo}`} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-neutral-900">
          + Nueva solicitud
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
              <th className="px-4 py-2">Fecha</th>
              <th>A favor de</th>
              <th>Proyecto</th>
              <th>Valor</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.data?.map((s) => (
              <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="px-4 py-2">{formatDate(s.fecha)}</td>
                <td>{s.aFavorDe}</td>
                <td>{s.project?.name}</td>
                <td>{formatCOP(s.items?.reduce((sum, i) => sum + i.valor, 0))}</td>
                <td><StatusBadge estado={s.estado} /></td>
                <td className="px-4">
                  <Link to={`/solicitudes/detalle/${s.id}`} className="text-sky-600 hover:underline">Ver</Link>
                </td>
              </tr>
            ))}
            {solicitudes.data?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-500">Aún no hay solicitudes de este tipo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
