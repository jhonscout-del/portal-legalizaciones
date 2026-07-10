import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { TIPO_SOLICITUD_LABELS, formatCOP, formatDate } from '../lib/constants.js'

const BANDEJAS = [
  { role: 'APROBADOR', bandeja: 'aprobador', title: 'Pendientes de tu visto bueno como Aprobador' },
  { role: 'CONTABLE', bandeja: 'contable', title: 'Pendientes de tu visto bueno como Contabilidad' },
  { role: 'ADMINISTRATIVO', bandeja: 'administrativo', title: 'Pendientes de tu visto bueno como Administrativo' },
]

export function BandejaAprobacion() {
  const { user } = useAuth()
  const applicable = BANDEJAS.filter((b) => user?.roles?.includes(b.role))

  const results = useQueries({
    queries: applicable.map((b) => ({
      queryKey: ['solicitudes', 'bandeja', b.bandeja],
      queryFn: () => api.get(`/solicitudes?bandeja=${b.bandeja}`),
    })),
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold">Bandeja de aprobación</h1>
      <p className="mt-1 text-sm text-neutral-500">Solicitudes pendientes de tu visto bueno.</p>

      <div className="mt-4 flex flex-col gap-6">
        {applicable.map((b, i) => (
          <BandejaTabla key={b.bandeja} title={b.title} solicitudes={results[i].data} />
        ))}
        {applicable.length === 0 && (
          <p className="text-neutral-500">No tienes un rol de aprobación asignado.</p>
        )}
      </div>
    </div>
  )
}

function BandejaTabla({ title, solicitudes }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400">{title}</h2>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
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
            {solicitudes?.map((s) => (
              <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="px-4 py-2">{TIPO_SOLICITUD_LABELS[s.tipo]}</td>
                <td>{formatDate(s.fecha)}</td>
                <td>{s.aFavorDe}</td>
                <td>{s.project?.name}</td>
                <td>{formatCOP(s.items?.reduce((sum, i) => sum + i.valor, 0))}</td>
                <td className="px-4"><Link to={`/solicitudes/detalle/${s.id}`} className="text-sky-600 hover:underline">Revisar</Link></td>
              </tr>
            ))}
            {solicitudes?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-500">No hay solicitudes pendientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
