import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { TIPO_SOLICITUD_LABELS, formatCOP, formatDate } from '../lib/constants.js'

const BANDEJA_POR_ROL = {
  APROBADOR: 'aprobador',
  CONTABLE: 'contable',
  ADMINISTRATIVO: 'administrativo',
}

export function BandejaAprobacion() {
  const { user } = useAuth()
  const bandeja = BANDEJA_POR_ROL[user?.role]
  const solicitudes = useQuery({
    queryKey: ['solicitudes', 'bandeja', bandeja],
    queryFn: () => api.get(`/solicitudes?bandeja=${bandeja}`),
    enabled: Boolean(bandeja),
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold">Bandeja de aprobación</h1>
      <p className="mt-1 text-sm text-neutral-500">Solicitudes pendientes de tu visto bueno.</p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
              <th className="px-4 py-2">Tipo</th>
              <th>Fecha</th>
              <th>A favor de</th>
              <th>Proyecto</th>
              <th>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.data?.map((s) => (
              <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="px-4 py-2">{TIPO_SOLICITUD_LABELS[s.tipo]}</td>
                <td>{formatDate(s.fecha)}</td>
                <td>{s.aFavorDe}</td>
                <td>{s.project?.name}</td>
                <td>{formatCOP(s.items?.reduce((sum, i) => sum + i.valor, 0))}</td>
                <td className="px-4"><Link to={`/solicitudes/detalle/${s.id}`} className="text-sky-600 hover:underline">Revisar</Link></td>
              </tr>
            ))}
            {solicitudes.data?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-500">No hay solicitudes pendientes de tu visto bueno.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
