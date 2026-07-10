import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { TIPO_SOLICITUD_LABELS, formatCOP, formatDate } from '../lib/constants.js'

const SOLICITUD_BANDEJAS = [
  { role: 'APROBADOR', bandeja: 'aprobador', title: 'Solicitudes pendientes de tu visto bueno como Aprobador' },
  { role: 'CONTABLE', bandeja: 'contable', title: 'Solicitudes pendientes de tu visto bueno como Contabilidad' },
  { role: 'ADMINISTRATIVO', bandeja: 'administrativo', title: 'Solicitudes pendientes de tu visto bueno como Administrativo' },
]

const LEGALIZACION_BANDEJAS = [
  { role: 'APROBADOR', bandeja: 'aprobador', title: 'Legalizaciones pendientes de tu visto bueno como Aprobador' },
  { role: 'CONTABLE', bandeja: 'contable', title: 'Legalizaciones pendientes de tu firma como Contabilidad' },
]

export function BandejaAprobacion() {
  const { user } = useAuth()
  const applicableSolicitudes = SOLICITUD_BANDEJAS.filter((b) => user?.roles?.includes(b.role))
  const applicableLegalizaciones = LEGALIZACION_BANDEJAS.filter((b) => user?.roles?.includes(b.role))

  const solicitudResults = useQueries({
    queries: applicableSolicitudes.map((b) => ({
      queryKey: ['solicitudes', 'bandeja', b.bandeja],
      queryFn: () => api.get(`/solicitudes?bandeja=${b.bandeja}`),
    })),
  })
  const legalizacionResults = useQueries({
    queries: applicableLegalizaciones.map((b) => ({
      queryKey: ['legalizaciones', 'bandeja', b.bandeja],
      queryFn: () => api.get(`/legalizaciones?bandeja=${b.bandeja}`),
    })),
  })

  const nothingToShow = applicableSolicitudes.length === 0 && applicableLegalizaciones.length === 0

  return (
    <div>
      <h1 className="text-2xl font-semibold">Bandeja de aprobación</h1>
      <p className="mt-1 text-sm text-neutral-500">Documentos pendientes de tu visto bueno.</p>

      <div className="mt-4 flex flex-col gap-6">
        {applicableSolicitudes.map((b, i) => (
          <SolicitudesTabla key={`s-${b.bandeja}`} title={b.title} solicitudes={solicitudResults[i].data} />
        ))}
        {applicableLegalizaciones.map((b, i) => (
          <LegalizacionesTabla key={`l-${b.bandeja}`} title={b.title} legalizaciones={legalizacionResults[i].data} />
        ))}
        {nothingToShow && (
          <p className="text-neutral-500">No tienes un rol de aprobación asignado.</p>
        )}
      </div>
    </div>
  )
}

function SolicitudesTabla({ title, solicitudes }) {
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

function LegalizacionesTabla({ title, legalizaciones }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400">{title}</h2>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
              <th className="px-4 py-2">Fecha anticipo</th>
              <th>Proyecto</th>
              <th>Actividad</th>
              <th>Anticipo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {legalizaciones?.map((l) => (
              <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="px-4 py-2">{formatDate(l.fechaSolicitudAnticipo)}</td>
                <td>{l.project?.name}</td>
                <td>{l.nombreActividad}</td>
                <td>{formatCOP(l.valorAnticipo)}</td>
                <td className="px-4"><Link to={`/legalizaciones/${l.id}`} className="text-sky-600 hover:underline">Revisar</Link></td>
              </tr>
            ))}
            {legalizaciones?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-500">No hay legalizaciones pendientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
