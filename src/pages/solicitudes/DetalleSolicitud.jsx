import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { StatusBadge } from '../../components/StatusBadge.jsx'
import { TIPO_SOLICITUD_LABELS, formatCOP, formatDate, formatDateTime } from '../../lib/constants.js'

export function DetalleSolicitud() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: s, isLoading } = useQuery({ queryKey: ['solicitud', id], queryFn: () => api.get(`/solicitudes/${id}`) })

  const vistoBuenoContable = useMutation({
    mutationFn: () => api.post(`/solicitudes/${id}/visto-bueno-contable`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitud', id] }),
  })
  const vistoBuenoAdmin = useMutation({
    mutationFn: () => api.post(`/solicitudes/${id}/visto-bueno-administrativo`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitud', id] }),
  })

  if (isLoading || !s) return <p>Cargando…</p>

  const total = s.items.reduce((sum, i) => sum + i.valor, 0)

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{TIPO_SOLICITUD_LABELS[s.tipo]} — No. {s.id}</h1>
          <div className="mt-1"><StatusBadge estado={s.estado} /></div>
        </div>
        <div className="flex gap-2">
          <a href={`/api/solicitudes/${s.id}/export.pdf`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">Exportar PDF</a>
          <a href={`/api/solicitudes/${s.id}/export.xlsx`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">Exportar Excel</a>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-lg font-semibold">Datos generales</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Detail label="Fecha" value={formatDate(s.fecha)} />
            <Detail label="A favor de" value={s.aFavorDe} />
            <Detail label="NIT o C.C." value={s.nitCc} />
            <Detail label="Teléfono" value={s.telefono} />
            <Detail label="Dirección" value={s.direccion} />
            <Detail label="Con cargo a" value={`${s.project?.businessUnit?.code} - ${s.project?.businessUnit?.name} (${s.project?.name})`} />
            <Detail label="Donante" value={s.project?.businessUnit?.donor} />
            <Detail label="Por concepto de" value={s.porConceptoDe} />
          </dl>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-lg font-semibold">Tabla de conceptos</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
                <th className="py-2">Concepto</th>
                <th>Fecha inicio</th>
                <th>Fecha fin</th>
                {s.tipo === 'OPERACIONAL' && <th>No. equipos</th>}
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {s.items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                  <td className="py-2">{item.concepto}</td>
                  <td>{formatDate(item.fechaInicio)}</td>
                  <td>{formatDate(item.fechaFin)}</td>
                  {s.tipo === 'OPERACIONAL' && <td>{item.numeroEquipos ?? ''}</td>}
                  <td>{formatCOP(item.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-right text-lg font-semibold">Total a girar: {formatCOP(total)}</p>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-lg font-semibold">Información bancaria</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Detail label="Cuenta corriente/ahorro No." value={s.cuentaBancariaNo} />
            <Detail label="Entidad bancaria" value={s.entidadBancaria} />
            <Detail label="A nombre de" value={s.aNombreDe} />
            <Detail label="Cédula o NIT titular" value={s.cedulaNitTitular} />
          </dl>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-lg font-semibold">Firmas y vistos buenos</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SignBlock label="Solicitante" name={s.solicitante?.name} />
            <div>
              <SignBlock label="Visto bueno contable" name={s.vistoBuenoContable?.name} at={s.vistoBuenoContableAt} />
              {user?.role === 'CONTABLE' && !s.vistoBuenoContable && (
                <button onClick={() => vistoBuenoContable.mutate()} className="mt-2 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700">
                  Dar visto bueno
                </button>
              )}
            </div>
            <div>
              <SignBlock label="Visto bueno administrativo" name={s.vistoBuenoAdmin?.name} at={s.vistoBuenoAdminAt} />
              {user?.role === 'ADMINISTRATIVO' && !s.vistoBuenoAdmin && (
                <button onClick={() => vistoBuenoAdmin.mutate()} className="mt-2 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700">
                  Dar visto bueno
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  )
}

function SignBlock({ label, name, at }) {
  return (
    <div>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="font-medium">{name || 'Pendiente'}</p>
      {at && <p className="text-xs text-neutral-500">{formatDateTime(at)}</p>}
    </div>
  )
}
