import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { StatusBadge } from '../../components/StatusBadge.jsx'
import { AttachmentsPanel } from '../../components/AttachmentsPanel.jsx'
import { Historial } from '../../components/Historial.jsx'
import { TIPO_SOLICITUD_LABELS, formatCOP, formatDate, formatDateTime } from '../../lib/constants.js'

export function DetalleSolicitud() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: s, isLoading } = useQuery({ queryKey: ['solicitud', id], queryFn: () => api.get(`/solicitudes/${id}`) })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['solicitud', id] })
    queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
  }

  const vistoBuenoAprobador = useMutation({
    mutationFn: () => api.post(`/solicitudes/${id}/visto-bueno-aprobador`),
    onSuccess: invalidate,
  })
  const vistoBuenoContable = useMutation({
    mutationFn: () => api.post(`/solicitudes/${id}/visto-bueno-contable`),
    onSuccess: invalidate,
  })
  const vistoBuenoAdmin = useMutation({
    mutationFn: () => api.post(`/solicitudes/${id}/visto-bueno-administrativo`),
    onSuccess: invalidate,
  })
  const rechazar = useMutation({
    mutationFn: (comentario) => api.post(`/solicitudes/${id}/rechazar`, { comentario }),
    onSuccess: invalidate,
  })

  if (isLoading || !s) return <p>Cargando…</p>

  const total = s.items.reduce((sum, i) => sum + i.valor, 0)
  const isOwner = user?.id === s.solicitanteId
  const canEdit = ['PENDIENTE', 'RECHAZADA'].includes(s.estado) && (isOwner || user?.roles?.includes('ADMINISTRATIVO'))
  const canReject = s.estado === 'PENDIENTE' && ['APROBADOR', 'CONTABLE', 'ADMINISTRATIVO'].some((r) => user?.roles?.includes(r))

  function handleReject() {
    const comentario = window.prompt('Motivo del rechazo (se notificará al solicitante):')
    if (comentario === null) return
    rechazar.mutate(comentario)
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{TIPO_SOLICITUD_LABELS[s.tipo]} — No. {s.id}</h1>
          <div className="mt-1"><StatusBadge estado={s.estado} /></div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link to={`/solicitudes/editar/${s.id}`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">
              Editar
            </Link>
          )}
          {canReject && (
            <button onClick={handleReject} className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 dark:border-red-800 dark:text-red-400">
              Rechazar
            </button>
          )}
          <a href={`/api/solicitudes/${s.id}/export.pdf`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">Exportar PDF</a>
          <a href={`/api/solicitudes/${s.id}/export.xlsx`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">Exportar Excel</a>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {s.estado === 'RECHAZADA' && (
          <section className="rounded-xl border border-red-300 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
            <h2 className="mb-1 text-lg font-semibold text-red-800 dark:text-red-300">Solicitud rechazada</h2>
            <p className="text-sm text-red-700 dark:text-red-400">
              {s.rechazadoPor?.name} — {formatDateTime(s.rechazadoAt)}
            </p>
            {s.comentarioRechazo && <p className="mt-1 text-sm text-red-700 dark:text-red-400">"{s.comentarioRechazo}"</p>}
          </section>
        )}

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
            {s.destinatarios && <Detail label="Destinatarios notificados" value={s.destinatarios} />}
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

        <AttachmentsPanel
          relatedType="SOLICITUD"
          relatedId={s.id}
          attachments={s.attachments}
          queryKey={['solicitud', id]}
        />

        <Historial
          eventos={[
            { label: 'Solicitud creada', name: s.solicitante?.name, at: s.createdAt },
            { label: 'Visto bueno del aprobador', name: s.vistoBuenoAprobador?.name, at: s.vistoBuenoAprobadorAt },
            { label: 'Visto bueno contable', name: s.vistoBuenoContable?.name, at: s.vistoBuenoContableAt },
            { label: 'Visto bueno administrativo (aprobación final)', name: s.vistoBuenoAdmin?.name, at: s.vistoBuenoAdminAt },
            { label: 'Rechazada', name: s.rechazadoPor?.name, at: s.rechazadoAt, detail: s.comentarioRechazo },
          ]}
        />

        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-lg font-semibold">Firmas y vistos buenos</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SignBlock label="Solicitante" name={s.solicitante?.name} />
            <div>
              <SignBlock label="Visto bueno aprobador" name={s.vistoBuenoAprobador?.name} at={s.vistoBuenoAprobadorAt} />
              {user?.roles?.includes('APROBADOR') && s.estado === 'PENDIENTE' && !s.vistoBuenoAprobador && (
                <button onClick={() => vistoBuenoAprobador.mutate()} className="mt-2 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700">
                  Dar visto bueno
                </button>
              )}
            </div>
            <div>
              <SignBlock label="Visto bueno contable" name={s.vistoBuenoContable?.name} at={s.vistoBuenoContableAt} />
              {user?.roles?.includes('CONTABLE') && s.estado === 'PENDIENTE' && !s.vistoBuenoContable && (
                s.vistoBuenoAprobador ? (
                  <button onClick={() => vistoBuenoContable.mutate()} className="mt-2 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700">
                    Dar visto bueno
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-neutral-500">Falta el visto bueno del aprobador</p>
                )
              )}
            </div>
            <div>
              <SignBlock label="Visto bueno administrativo" name={s.vistoBuenoAdmin?.name} at={s.vistoBuenoAdminAt} />
              {user?.roles?.includes('ADMINISTRATIVO') && s.estado === 'PENDIENTE' && !s.vistoBuenoAdmin && (
                s.vistoBuenoContable ? (
                  <button onClick={() => vistoBuenoAdmin.mutate()} className="mt-2 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700">
                    Dar visto bueno
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-neutral-500">Falta el visto bueno contable</p>
                )
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
